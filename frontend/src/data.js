import { shlokas, meanings, commentary } from './sahasranama';

export function getWordsForShlokaLine(shlokaNum, lineNum) {
  // shlokaNum and lineNum are 1-based
  if (
    shlokaNum < 1 || shlokaNum > shlokas.length ||
    lineNum < 1 || lineNum > shlokas[shlokaNum - 1].length
  ) {
    return [];
  }
  return shlokas[shlokaNum - 1][lineNum - 1];
}

export function getWordMeaningAndCommentary(shlokaNum, lineNum, wordIdx) {
  return {
    meaning: meanings[shlokaNum - 1]?.[lineNum - 1]?.[wordIdx] || '',
    commentary: commentary[shlokaNum - 1]?.[lineNum - 1]?.[wordIdx] || ''
  }
}

export function numberOfShlokas() {
  return shlokas.length;
}
