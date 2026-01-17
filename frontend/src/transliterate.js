import Sanscript from '@indic-transliteration/sanscript';

export const SCRIPTS = {
  DEVANAGARI: 'devanagari',
  KANNADA: 'kannada'
};

export const SCRIPT_LABELS = {
  [SCRIPTS.DEVANAGARI]: 'श्री',
  [SCRIPTS.KANNADA]: 'ಶ್ರೀ'
};

/**
 * Transliterate text from Devanagari to the target script
 * @param {string} text - Text in Devanagari script
 * @param {string} targetScript - Target script (devanagari or kannada)
 * @returns {string} - Transliterated text
 */
export function transliterate(text, targetScript) {
  if (targetScript === SCRIPTS.DEVANAGARI) {
    return text;
  }
  return Sanscript.t(text, SCRIPTS.DEVANAGARI, targetScript);
}

/**
 * Get the saved script preference from localStorage
 * @returns {string} - Script preference (devanagari or kannada)
 */
export function getSavedScript() {
  const saved = localStorage.getItem('selectedScript');
  return saved || SCRIPTS.DEVANAGARI;
}

/**
 * Save the script preference to localStorage
 * @param {string} script - Script to save (devanagari or kannada)
 */
export function saveScript(script) {
  localStorage.setItem('selectedScript', script);
}
