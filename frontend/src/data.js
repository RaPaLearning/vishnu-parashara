import { shlokas, meanings, commentary } from './sahasranama';

export function getWordsForShlokaLine(shlokaNum, lineNum) {
  // shlokaNum and lineNum are 1-based
  return shlokas[shlokaNum - 1]?.[lineNum - 1] || [];
}

export function getWordsAndMeaningsForShlokaLine(shlokaNum, lineNum) {
  const words = getWordsForShlokaLine(shlokaNum, lineNum);
  const meaningsForLine = meanings[shlokaNum - 1]?.[lineNum - 1] || [];
  const wordsAndMeanings = [];
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    wordsAndMeanings.push({
      word: words[wordIndex],
      meaning: meaningsForLine[wordIndex] || ''
    });
  }
  return wordsAndMeanings;
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
