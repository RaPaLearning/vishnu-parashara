import { getWord, getWordMeaningAndCommentary, getWordsForShlokaLine } from './data';

export function wordsBefore({ shlokaNum, lineNum, wordIndex }) {
  let wordsWindow;
  if (wordIndex > 2) {
    wordsWindow = getWordsForShlokaLine(shlokaNum, lineNum).slice(wordIndex - 3, wordIndex);
  } else {
    const shlokaWithPrevLine = lineNum > 1? shlokaNum : shlokaNum - 1;
    const prevLine = lineNum > 1 ? 1 : 2;
    if (shlokaWithPrevLine > 0) {
      wordsWindow = getWordsForShlokaLine(shlokaWithPrevLine, prevLine)
        .slice(- (3 - wordIndex))
        .concat(getWordsForShlokaLine(shlokaNum, lineNum)
        .slice(0, wordIndex));
    } else {
      wordsWindow = getWordsForShlokaLine(shlokaNum, lineNum).slice(0, wordIndex);
    }
  }
  if (wordsWindow?.length > 0) {
    const csWords = wordsWindow.map(word => word.trim()).join(', ');
    return `The names before this are ${csWords}\n`;
  }
  return '';
}

export function wordsAfter({ shlokaNum, lineNum, wordIndex }) {
  let nextWord;
  const wordsInLine = getWordsForShlokaLine(shlokaNum, lineNum);
  if (wordIndex < wordsInLine.length - 1) {
    nextWord = wordsInLine[wordIndex + 1];
  } else {
    const shlokaWithNextLine = lineNum < 2 ? shlokaNum : shlokaNum + 1;
    const nextLine = lineNum < 2 ? 2 : 1;
    nextWord = getWordsForShlokaLine(shlokaWithNextLine, nextLine)[0];
  }
  return nextWord ? `The name after this is ${nextWord.trim()}\n` : '';
}

export function beforeAfterContext(shlokaNum, lineNum, wordIndex) {
  const priors = wordsBefore({ shlokaNum, lineNum, wordIndex });
  const successors = wordsAfter({ shlokaNum, lineNum, wordIndex });
  return `For context:${priors}${successors}`;
}

export function subjectOfPrompt(word, meaning, commentary) {
  const meaningInBraces = meaning == '' ? '' : ` (${meaning})`;
  return `The word "${word}"${meaningInBraces} is explained as "${commentary}"`;
}

export function promptWithContext(shlokaNum, lineNum, wordIndex) {
  const word = getWord(shlokaNum, lineNum, wordIndex);
  const { meaning, commentary } = getWordMeaningAndCommentary(shlokaNum, lineNum, wordIndex);
  return `In Parashara Bhatta's commentary on the Vishnu Sahasranama,
${subjectOfPrompt(word, meaning, commentary)}
What does it mean?
${beforeAfterContext(shlokaNum, lineNum, wordIndex)}`;
}
