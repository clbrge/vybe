# Vybe - Code Assistant

## Origin Story

Vybe is a code assistant bootstrapped from a single prompt. The main script (`src/index.js`) was generated ("seeded") using the following prompt to Anthropic's claude-3-7-sonnet-20250219:

```
I need help creating a minimal code assistant in one monolithic Nodejs script that can analyze source files and answer questions about them. The assistant should:

    1. Read one or more files provided as command-line arguments
    2. Create a preprompt with the file contents formatted in proper markdown code blocks to preserve syntax, with each file path clearly labeled as a level 2 heading before its>
    3. Allow the user to ask a question about the code via the terminal
    4. Include a specific post-prompt instructions to the LLM that when suggesting file changes, it must:
       - Output COMPLETE file contents (not just the changed parts)
       - Format each file replacement in a consistent, parseable pattern (markdown code blocks with the filename as a level 2 heading)
    5. Use the Anthropic Claude API (model ${MODEL}) to generate responses based on the code and user question
    6. Parse the LLM's answer to detect new file versions by looking for specific patterns in the markdown format
    7. When one or more new file versions are detected save the updated version (but copy the original with the suffix .orig)
    8. Implement minimal error handling for file operations, API calls, and user input

Please provide a complete implementation using ES modules with:
    - A simple terminal-based interface with clear user prompts
    - Environment variable configuration ANTHROPIC_API_KEY for the API key
    - No external dependencies besides dotenv and the Anthropic SDK
Ensure the code follows modern JavaScript practices including async/await for asynchronous operations and proper command-line argument parsing.
```

## What is Vibe Coding?

Vibe coding is the concept of programming by just explaining a goal to an LLM (Large Language Model). With Vybe, we push this concept to the extreme by bootstrapping the simplest possible coding assistant using just one manual prompt.

## The Bootstrapping Approach

Our approach is unique:
1. We started with a single prompt to create a basic code assistant
2. This resulted in the first version of Vybe
3. Future improvements will use Vybe itself to improve Vybe

This meta-development approach stays true to our philosophy of vibe coding - letting the LLM do the heavy lifting based on high-level descriptions of what we want.

## Core Features

The initial version of Vybe can:
- Read source files provided as command-line arguments
- Allow users to ask questions about the code via terminal
- Analyze code using Claude API (Anthropic's LLM)
- Parse and apply suggested file changes
- Backup original files before modification

## Getting Started

1. Set up your environment variables:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

2. Run Vybe:
   ```
   node src/index.js path/to/file1.js path/to/file2.js
   ```

3. Ask questions about your code and apply suggested changes when prompted

## Future Development

True to our vibe coding philosophy, all future improvements to Vybe will be made using Vybe itself. This creates a fascinating development cycle where the tool evolves through its own capabilities.

## License

[MIT](LICENSE)
