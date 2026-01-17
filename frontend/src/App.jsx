
import './App.css';
import { useState } from 'react';
import { getWordsForShlokaLine, getWordMeaningAndCommentary, numberOfShlokas } from './data';
import { promptWithContext } from './prompt';
import { SCRIPT_LABELS, transliterate, getSavedScript, saveScript } from './transliterate';

function App() {
  const [highlighted, setHighlighted] = useState({ shloka: null, line: null, idx: null });
  const [selectedScript, setSelectedScript] = useState(getSavedScript());

  const [context, setContext] = useState('');
  const handleScriptChange = (script) => {
    setSelectedScript(script);
    saveScript(script);
  };

  const copyContext = (shlokaNum, lineNum, wordIndex) => {
    const textToCopy = promptWithContext(shlokaNum, lineNum, wordIndex);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setContext(textToCopy);
    });
  };
  const launchChatGPT = () => {
    window.open(`https://chatgpt.com/?prompt=${encodeURIComponent(context)}`);
  };

  const handleHighlight = (shloka, line, idx) => {
    setHighlighted({ shloka, line, idx });
    setContext('');
    localStorage.setItem(
      'highlightedWord',
      JSON.stringify({ shloka, line, idx })
    );
  };
  // Recall highlighted word at startup
  useState(() => {
    const saved = localStorage.getItem('highlightedWord');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.shloka === 'number' &&
          typeof parsed.line === 'number' &&
          typeof parsed.idx === 'number'
        ) {
          setHighlighted(parsed);
          setTimeout(() => {
            const shlokaElement = document.querySelector(`[data-shloka="${parsed.shloka}"]`);
            if (shlokaElement) {
              shlokaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 0);
        }
      } catch {
        console.error('Failed to parse saved highlighted word from localStorage');
      }
    }
  });

  const formatWordsInShlokaLine = (shlokaNum, lineNum) => {
    return (
      <>
        {getWordsForShlokaLine(shlokaNum, lineNum).map((word, idx) => {
          const isHighlighted =
            highlighted.shloka === shlokaNum &&
            highlighted.line === lineNum &&
            highlighted.idx === idx;
          const displayWord = transliterate(word, selectedScript);
          return (
              <span className={isHighlighted ? 'highlight-word' : undefined}
              key={idx}
              style={{
                paddingLeft: '0.4rem',
                paddingRight: '0.4rem',
                paddingBottom: '0.1rem',
                borderRadius: isHighlighted ? '0.3em' : undefined,
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s'
              }}
              onClick={() => handleHighlight(shlokaNum, lineNum, idx)}
              >
              {displayWord}
              </span>
            );
        })}
        <span>{transliterate(lineEndings[lineNum - 1](shlokaNum), selectedScript)}</span>
      </>
    );
  };

  const explanationContent = () => {
    if (!highlighted.shloka || !highlighted.line || highlighted.idx === null) {
      return {word: '', meaning: '', commentary: ''};
    }
    const words = getWordsForShlokaLine(highlighted.shloka, highlighted.line);
    const word = words[highlighted.idx];
    const displayWord = transliterate(word, selectedScript);
    const { meaning, commentary } = getWordMeaningAndCommentary(
      highlighted.shloka,
      highlighted.line,
      highlighted.idx
    );
    return {word: displayWord, meaning, commentary};
  };

  const { word, meaning, commentary } = explanationContent();

  return (
    <>
      <div className="shloka-box">
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        {Object.entries(SCRIPT_LABELS).map(([script, label]) => (
          <button
            key={script}
            className={selectedScript === script ? 'script-selector selected' : 'script-selector'}
            onClick={() => handleScriptChange(script)}
            style={{
              fontSize: '1rem',
              color: selectedScript === script ? 'orange' : '#666',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              margin: '0 0.25rem',
              fontWeight: selectedScript === script ? 'bold' : 'normal',
              transition: 'color 0.2s, font-weight 0.2s'
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {Array.from({ length: numberOfShlokas() }, (_, i) => i + 1).map((shlokaNum) => (
        <div key={shlokaNum} data-shloka={shlokaNum}>
        {[1, 2].map((lineNum) => (
          <div key={lineNum}>{formatWordsInShlokaLine(shlokaNum, lineNum)}</div>
        ))}
        <div style={{ height: '1rem' }}></div>
        </div>
      ))}
      </div>
      <div className="meaning-box" style={{ position: 'relative' }}>
      <div data-testid="meaning-container">
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
          {word ? word : 'Click on a name to see its commentary.'}
        </div>
        <div style={{ fontWeight: 500, marginBottom: 4, whiteSpace: 'normal' }}>{meaning}</div>
        <div>
        {commentary.split('\n').map((line, idx) => (
          <div key={idx} style={{ fontSize: '1.2rem' }}>{line}</div>
        ))}
        </div>
      </div>
      {word && (
        <div style={{ display: 'flex', justifyContent: 'left', marginTop: 16 }}>
        <button className='highlight-word'
          aria-label="Chat"
          onClick={() => {
            if (context.length == 0) {
              copyContext(highlighted.shloka, highlighted.line, highlighted.idx);
            } else {
              launchChatGPT();
            }
          }}
        >
          {/* Simple chat icon SVG */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        {context.length > 0 && (
        <div style={{ marginLeft: 8, cursor: 'pointer' }} onClick={launchChatGPT}>
          <div>Prompt copied. Paste in an AI chat.</div>
          <div style={{ color: '#007acc', textDecoration: 'underline'}}>
            Or click to launch in chatgpt.com. Press send there
          </div>
        </div>
        )}
        </div>
      )}
      </div>
    </>
  );
}

const lineEndings = [
  () => '।', (shlokaNum) => `॥ ${shlokaNum} ॥`
];

export default App
