This directory contains agent hooks related to source modifications.

- `post-agent-file-modify.json` — Hook definition triggered after the agent modifies files. It runs `run-line-check.js`.
- `run-line-check.js` — Runner that invokes `bun run scripts/check-line-length.ts` for each modified file and exits with non-zero if any files contain lines longer than 100 characters.

Behavior and testing

1. Ensure `bun` is available in the environment (this project currently uses `bun` for the check script).
2. To run the runner manually:

```bash
node .github/hooks/run-line-check.js src/path/to/file.ts
```

3. If the runner exits non-zero, the agent/system should block further automated changes and notify the agent with a message instructing: "Refactor Tailwind class lists into grouped expressions using `clsx` to keep lines under 100 chars."

Notes

- The hook passes `{{modified_files}}` to the runner; your automation framework should expand this placeholder into a list of file paths.
- You can adjust the max length by editing the runner to pass a different value to `scripts/check-line-length.ts`.
