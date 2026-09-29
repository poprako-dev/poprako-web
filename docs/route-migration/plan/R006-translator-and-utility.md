# R006 · Translator and utility workflows

**Owner:** translator worker. **Dependencies:** R003 and R007. **Status:**
locally verified.

**Interface:** full-screen translator route consumes ready session and R002c API
contracts; shared utility functions remain business-independent.

**Work:** migrate editor, unit state, persistence, search/transform,
terminology, keyboard scopes, page stats, shortcuts and browser utility
workflows. Preserve controller authority, patch/save IDs, IME behavior and
original image handling.

**Deletion:** old BaseTranslator/WebTranslator and utility feature trees; remove
unused theme mechanism, but keep light palette and existing functional UI.

**Tests/evidence:** translator and utility unit/Storybook tests, keyboard/IME
plays, save race/retry/read-only checks, browser Worker/compression tests and
full-screen route tests.

Final evidence: [implementation results](../review/implementation-results.md).
