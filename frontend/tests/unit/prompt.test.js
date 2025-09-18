import {wordsBefore, wordsAfter, promptWithContext} from '../../src/prompt';

describe('prompt context generation', () => {
  it('generates correct words before a middle word', () => {
    expect(wordsBefore({ shlokaNum: 4, lineNum: 1, wordIndex: 3 }))
        .toBe('The names before this are सर्वः, शर्वः, शिवः\n');
  });
  it('generates correct words before a first word in the second line', () => {
    expect(wordsBefore({ shlokaNum: 2, lineNum: 2, wordIndex: 0 }))
        .toBe('The names before this are पूतात्मा, परमात्मा च, मुक्तानां परमा गतिः\n');
  });
  it('generates correct words before a first word in the first line', () => {
    expect(wordsBefore({ shlokaNum: 2, lineNum: 1, wordIndex: 0 }))
        .toBe('The names before this are भावः, भूतात्मा, भूतभावनः\n');
  });
  it('generates one word before the second word in the first line', () => {
    expect(wordsBefore({ shlokaNum: 1, lineNum: 1, wordIndex: 1 }))
        .toBe('The names before this are विश्वं\n');
  });
  it('generates no words before the first word in the first line', () => {
    expect(wordsBefore({ shlokaNum: 1, lineNum: 1, wordIndex: 0 }))
        .toBe('');
  });
  it('generates correct words after a middle word', () => {
    expect(wordsAfter({ shlokaNum: 4, lineNum: 1, wordIndex: 3 }))
        .toBe('The name after this is भूतादिः\n');
  });
  it('generates correct words after the last word in the first line', () => {
    expect(wordsAfter({ shlokaNum: 1, lineNum: 1, wordIndex: 3 }))
        .toBe('The name after this is भूतकृत्\n');
  });
  it('generates correct words after the last word in the second line', () => {
    expect(wordsAfter({ shlokaNum: 2, lineNum: 2, wordIndex: 4 }))
        .toBe('The name after this is योगो\n');
  });
  it('generates no words after the last word in the last shloka', async () => {
    const {shlokas} = await import('../../src/sahasranama');
    const lastShlokaNum = shlokas.length;
    const lastWordIndex = shlokas[lastShlokaNum - 1][1].length - 1;
    expect(wordsAfter({ shlokaNum: lastShlokaNum, lineNum: 2, wordIndex: lastWordIndex }))
        .toBe('');
  });
  it('generates a prompt with context', () => {
    const prompt = promptWithContext(4, 1, 3);
    expect(prompt.startsWith("In Parashara Bhatta's commentary on the Vishnu Sahasranama")).toBe(true);
  });
});
