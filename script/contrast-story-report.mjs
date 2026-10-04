/** A successful test process needs one clean evidence record for every executed story.
 * @param {string} log @param {boolean} success
 */
export function storyReport(log, success) {
  log = stripVTControlCharacters(log);
  const records = new Map();
  const errors = [];
  for (const line of log.split("\n")) {
    const marker = "CONTRAST_STORY_EVIDENCE ";
    const start = line.indexOf(marker);
    if (start < 0) continue;
    try {
      const record = JSON.parse(line.slice(start + marker.length));
      if (typeof record.storyId !== "string" || !record.storyId)
        throw new Error("Missing story ID");
      const evidence = record.evidence;
      if (
        !Array.isArray(evidence?.violations) ||
        !Array.isArray(evidence?.contrast?.unresolved) ||
        !Array.isArray(evidence?.nonText?.failures)
      )
        throw new Error("Incomplete story evidence");
      if (
        evidence.violations.length ||
        evidence.contrast.unresolved.length ||
        evidence.nonText.failures.length
      )
        errors.push(`Failed evidence: ${record.storyId}`);
      records.set(record.storyId, record);
    } catch (error) {
      errors.push(`Invalid story evidence: ${String(error)}`);
    }
  }
  const summary = log.match(/Tests[^\n]*\((\d+)\)/);
  const expected = summary ? Number(summary[1]) : 0;
  if (!expected || records.size !== expected)
    errors.push(`Expected ${expected} stories, received ${records.size}`);
  if (!success) errors.push("Storybook process failed");
  return { passed: errors.length === 0, expected, errors, stories: [...records.values()] };
}
import { stripVTControlCharacters } from "node:util";
