import {wordsBefore, wordsAfter, promptWithContext} from '../../src/prompt';

describe('prompt context generation', () => {
  it('generates correct words before a middle word', () => {
    const beforeSequence = wordsBefore({ shlokaNum: 4, lineNum: 1, wordIndex: 3 });
    expect(beforeSequence).toContain('सर्वः (All)');
    expect(beforeSequence).toContain('शर्वः (Remover)');
    expect(beforeSequence).toContain('शिवः (Confers auspiciousness)');
  });
  it('generates correct words before a first word in the second line', () => {
    const beforeSequence = wordsBefore({ shlokaNum: 2, lineNum: 2, wordIndex: 0 });
    expect(beforeSequence).toContain('पूतात्मा (Pure Self)');
    expect(beforeSequence).toContain('परमात्मा च (Ultimate Self)');
    expect(beforeSequence).toContain('मुक्तानां परमा गतिः (Supreme goal of the liberated)');
  });
  it('generates correct words before a first word in the first line', () => {
    const beforeSequence = wordsBefore({ shlokaNum: 2, lineNum: 1, wordIndex: 0 });
    expect(beforeSequence).toContain('भावः (One who exists)');
    expect(beforeSequence).toContain('भूतात्मा (Basis of all beings)');
    expect(beforeSequence).toContain('भूतभावनः (One who nourishes all beings)');
  });
  it('generates one word before the second word in the first line', () => {
    expect(wordsBefore({ shlokaNum: 1, lineNum: 1, wordIndex: 1 }))
        .toContain('विश्वं (Complete in all respects)');
  });
  it('generates no words before the first word in the first line', () => {
    expect(wordsBefore({ shlokaNum: 1, lineNum: 1, wordIndex: 0 }))
        .toBe('');
  });
  it('generates correct words after a middle word', () => {
    expect(wordsAfter({ shlokaNum: 4, lineNum: 1, wordIndex: 3 }))
        .toContain('भूतादिः (Eagerly resorted to by all)');
  });
  it('generates correct words after the last word in the first line', () => {
    expect(wordsAfter({ shlokaNum: 1, lineNum: 1, wordIndex: 3 }))
        .toContain('भूतकृत् (Creator of all beings)');
  });
  it('generates correct words after the last word in the second line', () => {
    expect(wordsAfter({ shlokaNum: 2, lineNum: 2, wordIndex: 4 }))
        .toContain('योगो (The means)');
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
