import Sanscript from '@indic-transliteration/sanscript';

export const SCRIPTS = {
  DEVANAGARI: 'devanagari',
  KANNADA: 'kannada',
  IAST: 'iast'
};

export const SCRIPT_LABELS = {
  [SCRIPTS.DEVANAGARI]: 'श्री',
  [SCRIPTS.KANNADA]: 'ಶ್ರೀ',
  [SCRIPTS.IAST]: 'śrī'
};

/**
 * Apply Kannada-specific post-processing to transliterated text.
 * Converts nasal half-consonants (ṅa=ಙ, ṇa=ಣ, na=ನ, ma=ಮ) followed by virama
 * to anusvara (ಂ), which is the conventional form in Kannada.
 * ña (ಞ) is excluded and remains unchanged (e.g., ಯಜ್ಞಃ stays as is).
 * Only replaces word-internal occurrences: the nasal must be preceded and
 * followed by a Kannada character, but remains unchanged before another nasal
 * in the same set (ಙ, ಣ, ನ, ಮ). Half-letters at the start or end of a word
 * (e.g. ನ್ಯಾಯೋ, ಶ್ರೀಮಾನ್) are also left unchanged.
 * @param {string} text - Kannada transliterated text
 * @returns {string} - Post-processed Kannada text
 */
export function applyKannadaTransliteration(text) {
  return text.replace(/(?<=[\u0C80-\u0CFF])[ಙಣನಮ]್(?=[\u0C80-\u0CFF])(?![ಙಣನಮ])/g, 'ಂ');
}

/**
 * Transliterate text from Devanagari to the target script
 * @param {string} text - Text in Devanagari script
 * @param {string} targetScript - Target script (devanagari, kannada, or iast)
 * @returns {string} - Transliterated text
 */
export function transliterate(text, targetScript) {
  if (targetScript === SCRIPTS.DEVANAGARI) {
    return text;
  }
  const result = Sanscript.t(text, SCRIPTS.DEVANAGARI, targetScript);
  if (targetScript === SCRIPTS.KANNADA) {
    return applyKannadaTransliteration(result);
  }
  return result;
}

/**
 * Get the saved script preference from localStorage
 * @returns {string} - Script preference (devanagari, kannada, or iast)
 */
export function getSavedScript() {
  const saved = localStorage.getItem('selectedScript');
  return saved || SCRIPTS.DEVANAGARI;
}

/**
 * Save the script preference to localStorage
 * @param {string} script - Script to save (devanagari, kannada, or iast)
 */
export function saveScript(script) {
  localStorage.setItem('selectedScript', script);
}
