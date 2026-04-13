// @ts-nocheck
// Deduplication logic for events
import stringSimilarity from 'string-similarity';

export function isDuplicate(a, b) {
  return (
    stringSimilarity.compareTwoStrings(a.title, b.title) > 0.9 &&
    a.startTime === b.startTime &&
    a.venue?.name === b.venue?.name
  );
}
