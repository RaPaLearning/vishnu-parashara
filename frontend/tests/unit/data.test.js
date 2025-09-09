import { getWordsForShlokaLine, getWordMeaningAndCommentary } from '../../src/data';

describe('getWordsForShlokaLine', () => {
  it('returns the correct array of words for shloka 1, line 1', () => {
    const words = getWordsForShlokaLine(1, 1);
    expect(Array.isArray(words)).toBe(true);
    expect(words.length).toBe(4);
    expect(words.every(w => typeof w === 'string')).toBe(true);
  });

  it('returns the correct array of words for shloka 2, line 2', () => {
    const words = getWordsForShlokaLine(2, 2);
    expect(Array.isArray(words)).toBe(true);
    expect(words.length).toBe(5);
  });
});

describe('getWordMeaningAndCommentary', () => {
  it('returns an object with meaning and commentary for a valid word', () => {
    const result = getWordMeaningAndCommentary(1, 1, 0);
    expect(result).toHaveProperty('meaning');
    expect(result).toHaveProperty('commentary');
    expect(result.meaning.length).toBeGreaterThan(0);
    expect(result.commentary).toBe('विश्वम्‌ सर्वत्र पूर्णत्वात् स्वरूप-गुण-विभवै:');
  });

  it('returns empty meaning and commentary for out-of-bounds word index', () => {
    const result = getWordMeaningAndCommentary(1, 1, 100);
    expect(result).toEqual({ meaning: '', commentary: '' });
  });
});
