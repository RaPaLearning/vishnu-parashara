import { transliterate, applyKannadaTransliteration, SCRIPTS, SCRIPT_LABELS, getSavedScript, saveScript } from '../../src/transliterate';

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

  it('should transliterate Devanagari text to IAST', () => {
    const text = 'श्री';
    const result = transliterate(text, SCRIPTS.IAST);
    expect(result).toBe('śrī');
  });

  it('should transliterate a Sanskrit name to IAST correctly', () => {
    const text = 'विष्णुः';
    const result = transliterate(text, SCRIPTS.IAST);
    expect(result).toBe('viṣṇuḥ');
  });

  it('should use anusvara for nasal half-consonant ṅa (ṅ+virama) in Kannada', () => {
    const result = transliterate('वेदाङ्गः', SCRIPTS.KANNADA);
    expect(result).toBe('ವೇದಾಂಗಃ');
  });

  it('should use anusvara for nasal half-consonant na (n+virama) in Kannada', () => {
    const result = transliterate('अनन्तात्मा', SCRIPTS.KANNADA);
    expect(result).toBe('ಅನಂತಾತ್ಮಾ');
  });

  it('should keep ña (ಞ) unchanged in Kannada', () => {
    const result = transliterate('यज्ञः', SCRIPTS.KANNADA);
    expect(result).toBe('ಯಜ್ಞಃ');
  });

  it('should keep word-final nasal half-consonant unchanged in Kannada', () => {
    const result = transliterate('श्रीमान्', SCRIPTS.KANNADA);
    expect(result).toBe('ಶ್ರೀಮಾನ್');
  });

  it('should keep word-initial nasal half-consonant unchanged in Kannada', () => {
    const result = transliterate('न्यायो', SCRIPTS.KANNADA);
    expect(result).toBe('ನ್ಯಾಯೋ');
  });
});

describe('SCRIPT_LABELS', () => {
  it('should have correct labels for all scripts', () => {
    expect(SCRIPT_LABELS[SCRIPTS.DEVANAGARI]).toBe('श्री');
    expect(SCRIPT_LABELS[SCRIPTS.KANNADA]).toBe('ಶ್ರೀ');
    expect(SCRIPT_LABELS[SCRIPTS.IAST]).toBe('śrī');
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

  it('should save and retrieve iast preference', () => {
    localStorage.clear();
    saveScript(SCRIPTS.IAST);
    const result = getSavedScript();
    expect(result).toBe(SCRIPTS.IAST);
  });
});

describe('applyKannadaTransliteration', () => {
  it('should replace ṅa+virama (ಙ್) with anusvara (ಂ)', () => {
    expect(applyKannadaTransliteration('ವೇದಾಙ್ಗಃ')).toBe('ವೇದಾಂಗಃ');
  });

  it('should replace na+virama (ನ್) with anusvara (ಂ)', () => {
    expect(applyKannadaTransliteration('ಅನನ್ತಾತ್ಮಾ')).toBe('ಅನಂತಾತ್ಮಾ');
  });

  it('should replace ṇa+virama (ಣ್) with anusvara (ಂ)', () => {
    expect(applyKannadaTransliteration('ಷಣ್ಮುಖ')).toBe('ಷಂಮುಖ');
  });

  it('should replace ma+virama (ಮ್) with anusvara (ಂ) when nasal half-consonant', () => {
    expect(applyKannadaTransliteration('ಸಮ್ಭವ')).toBe('ಸಂಭವ');
  });

  it('should not replace ña+virama (ಞ್) with anusvara', () => {
    expect(applyKannadaTransliteration('ಯಜ್ಞಃ')).toBe('ಯಜ್ಞಃ');
  });

  it('should not affect text without nasal half-consonants', () => {
    expect(applyKannadaTransliteration('ಶ್ರೀ')).toBe('ಶ್ರೀ');
  });

  it('should not replace na+virama (ನ್) at the end of a word', () => {
    expect(applyKannadaTransliteration('ಶ್ರೀಮಾನ್')).toBe('ಶ್ರೀಮಾನ್');
  });

  it('should not replace na+virama (ನ್) at the beginning of a word', () => {
    expect(applyKannadaTransliteration('ನ್ಯಾಯೋ')).toBe('ನ್ಯಾಯೋ');
  });
});
