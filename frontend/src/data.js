import { shlokas, meanings, commentary } from './sahasranama';

export function getWordsForShlokaLine(shlokaNum, lineNum) {
  // shlokaNum and lineNum are 1-based
  return shlokas[shlokaNum - 1]?.[lineNum - 1] || [];
}

export function getWord(shlokaNum, lineNum, wordIdx) {
  const words = getWordsForShlokaLine(shlokaNum, lineNum);
  return words[wordIdx] || '';
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
