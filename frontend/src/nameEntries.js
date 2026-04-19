import { getWordMeaningAndCommentary, getWordsForShlokaLine, numberOfShlokas } from './data';

export const lineEndings = [
  () => '।',
  (shlokaNum) => `॥ ${shlokaNum} ॥`
];

export function getAllNameEntries() {
  const entries = [];

  for (let shloka = 1; shloka <= numberOfShlokas(); shloka += 1) {
    for (let line = 1; line <= 2; line += 1) {
      const words = getWordsForShlokaLine(shloka, line);
      words.forEach((word, idx) => {
        const { meaning, commentary } = getWordMeaningAndCommentary(shloka, line, idx);
        entries.push({ shloka, line, idx, word, meaning, commentary });
      });
    }
  }

  return entries;
}

export function isSameEntry(entry, selected) {
  return (
    entry.shloka === selected.shloka &&
    entry.line === selected.line &&
    entry.idx === selected.idx
  );
}
