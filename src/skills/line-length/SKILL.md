# Line Length Skill (TypeScript + Bun)

## Purpose

This skill provides a small, reusable utility and documentation that checks a target file for any lines whose character count exceeds a configurable limit (default: 100). It is implemented in TypeScript and intended to be executed with `bun`.

## Behavior

- Input: a file path and an optional numeric `max` length.
- Output: JSON array printed to stdout listing 1-based line numbers that exceed the `max` length.

If no lines exceed the threshold, the script outputs `[]`.

## Files

- Script: `scripts/check-line-length.ts` — the executable TypeScript implementation.

## Usage

Run with Bun (works when `bun` is installed):

```
bun run scripts/check-line-length.ts <file-path> [max=100]
```

Example:

```
bun run scripts/check-line-length.ts src/App.tsx 100
```

The command prints a JSON array of offending line numbers, e.g. `[12,45,78]`.

## Implementation notes

- The script reads the file using Node-compatible `fs` APIs and splits on CRLF or LF.
- Default max length is 100 characters per line but is configurable via the second CLI argument.
- Return value: script prints JSON to stdout and exits with code `0`. If input is missing, it prints usage and exits `2`.

## Example prompt to reuse this skill

"Check whether `src/features/BaseTranslator/components/business/Translator.tsx` has any lines exceeding 100 chars; return the array of offending line numbers. Use the skill's script at `scripts/check-line-length.ts`."
