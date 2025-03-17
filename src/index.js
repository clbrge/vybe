#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables
dotenv.config();

const CLAUDE_MODEL = 'claude-3-7-sonnet-20250219';
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: API_KEY,
});

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const extension = path.extname(filePath).slice(1);
    return {
      path: filePath,
      content,
      extension,
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    throw error;
  }
}

function buildPrePrompt(files) {
  let preprompt = "# Code Files\n\n";
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file.path);
    preprompt += `## ${relativePath}\n\n`;
    preprompt += `\`\`\`${file.extension}\n${file.content}\n\`\`\`\n\n`;
  }
  
  return preprompt;
}

const postPrompt = `
When suggesting file changes, please:
1. Always provide the COMPLETE file contents (not just the changed parts)
2. Format each file replacement using markdown code blocks with the filename as a level 2 heading
3. Use this exact format for any file you want to modify:

## filename.ext

\`\`\`filetype
// Complete file content here, including all unchanged parts
\`\`\`

This format is essential as it will be used to automatically update the files.
`;

async function detectFileChanges(response, files) {
  const fileChanges = [];
  const filePathRegex = /^## (.+?)\s*\n\s*```[\w-]*\n([\s\S]*?)```/gm;
  
  let match;
  while ((match = filePathRegex.exec(response)) !== null) {
    const filePath = match[1].trim();
    const newContent = match[2];
    
    // Find if this file exists in our original files
    const originalFilePath = files.find(f => {
      const relativePath = path.relative(process.cwd(), f.path);
      return relativePath === filePath || f.path === filePath;
    })?.path;
    
    if (originalFilePath) {
      fileChanges.push({
        path: originalFilePath,
        newContent,
      });
    }
  }
  
  return fileChanges;
}

async function saveFileChanges(fileChanges) {
  for (const change of fileChanges) {
    try {
      // Check if file exists and get current content
      const currentContent = await fs.readFile(change.path, 'utf8');
      
      // Only save if content is different
      if (currentContent.trim() !== change.newContent.trim()) {
        // Create backup with .orig extension
        const backupPath = `${change.path}.orig`;
        await fs.writeFile(backupPath, currentContent);
        
        // Write new content
        await fs.writeFile(change.path, change.newContent);
        
        console.log(`Updated file: ${change.path} (original backed up to ${backupPath})`);
      } else {
        console.log(`No changes detected for file: ${change.path}`);
      }
    } catch (error) {
      console.error(`Error saving changes to ${change.path}:`, error.message);
    }
  }
}

async function askQuestion() {
  return new Promise((resolve) => {
    rl.question('\nAsk a question about the code (or type "exit" to quit): ', (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  // Get file paths from command-line arguments
  const filePaths = process.argv.slice(2);
  
  if (filePaths.length === 0) {
    console.error('Error: No file paths provided');
    console.log('Usage: node code-assistant.js <file1> <file2> ...');
    process.exit(1);
  }
  
  console.log(`Reading ${filePaths.length} file(s)...`);
  
  // Read all files
  const files = [];
  for (const filePath of filePaths) {
    try {
      const file = await readFile(filePath);
      files.push(file);
      console.log(`Loaded: ${filePath}`);
    } catch (error) {
      // Error already logged in readFile
      process.exit(1);
    }
  }
  
  // Build pre-prompt with file content
  const preprompt = buildPrePrompt(files);
  
  while (true) {
    const question = await askQuestion();
    
    if (question.toLowerCase() === 'exit') {
      break;
    }
    
    if (!question) {
      console.log('Please ask a question or type "exit" to quit.');
      continue;
    }
    
    console.log('\nGenerating response...');
    
    try {
      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${preprompt}\n\nQuestion: ${question}\n\n${postPrompt}`
              }
            ]
          }
        ],
      });
      
      const response = message.content[0].text;
      console.log('\n' + response + '\n');
      
      // Detect file changes in the response
      const fileChanges = await detectFileChanges(response, files);
      
      if (fileChanges.length > 0) {
        const answer = await new Promise((resolve) => {
          rl.question(`${fileChanges.length} file change(s) detected. Apply these changes? (y/n): `, resolve);
        });
        
        if (answer.toLowerCase() === 'y') {
          await saveFileChanges(fileChanges);
        } else {
          console.log('File changes not applied.');
        }
      }
    } catch (error) {
      console.error('Error generating response:', error.message);
    }
  }
  
  rl.close();
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});