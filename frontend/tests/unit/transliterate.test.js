import { transliterate, SCRIPTS, SCRIPT_LABELS, getSavedScript, saveScript } from '../../src/transliterate';

describe('transliterate', () => {
  it('should return the same text for Devanagari script', () => {
    const text = 'विश्वं';
    const result = transliterate(text, SCRIPTS.DEVANAGARI);
    expect(result).toBe(text);
  });

  it('should transliterate Devanagari text to Kannada', () => {
    const text = 'श्री';
    const result = transliterate(text, SCRIPTS.KANNADA);
    expect(result).toBe('ಶ್ರೀ');
  });

  it('should transliterate the name correctly', () => {
    const text = 'विष्णुः';
    const result = transliterate(text, SCRIPTS.KANNADA);
    expect(result).toMatch('ವಿಷ್ಣುಃ');
  });
});

describe('SCRIPT_LABELS', () => {
  it('should have correct labels for both scripts', () => {
    expect(SCRIPT_LABELS[SCRIPTS.DEVANAGARI]).toBe('श्री');
    expect(SCRIPT_LABELS[SCRIPTS.KANNADA]).toBe('ಶ್ರೀ');
  });
});

describe('getSavedScript and saveScript', () => {
  it('should return devanagari as default when no script is saved', () => {
    localStorage.clear();
    const result = getSavedScript();
    expect(result).toBe(SCRIPTS.DEVANAGARI);
  });

  it('should save and retrieve the script preference', () => {
    localStorage.clear();
    saveScript(SCRIPTS.KANNADA);
    const result = getSavedScript();
    expect(result).toBe(SCRIPTS.KANNADA);
  });

  it('should save and retrieve devanagari preference', () => {
    localStorage.clear();
    saveScript(SCRIPTS.DEVANAGARI);
    const result = getSavedScript();
    expect(result).toBe(SCRIPTS.DEVANAGARI);
  });
});
