
import './App.css';
import { useState } from 'react';
import { getWordsForShlokaLine, getWordMeaningAndCommentary, numberOfShlokas } from './data';
import { promptWithContext } from './prompt';

function App() {
  const [highlighted, setHighlighted] = useState({ shloka: null, line: null, idx: null });

  const [context, setContext] = useState('');
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
              {word}
              </span>
            );
        })}
        <span>{lineEndings[lineNum - 1](shlokaNum)}</span>
      </>
    );
  };

  const explanationContent = () => {
    if (!highlighted.shloka || !highlighted.line || highlighted.idx === null) {
      return {word: '', meaning: '', commentary: ''};
    }
    const words = getWordsForShlokaLine(highlighted.shloka, highlighted.line);
    const word = words[highlighted.idx];
    const { meaning, commentary } = getWordMeaningAndCommentary(
      highlighted.shloka,
      highlighted.line,
      highlighted.idx
    );
    return {word, meaning, commentary};
  };

  const { word, meaning, commentary } = explanationContent();

  return (
    <>
      <div className="shloka-box">
      <p style={{ textAlign: 'center', fontSize: '1rem', color: 'orange' }}>श्री</p>
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
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{meaning}</div>
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
          <div>Paste the prompt into an AI chat and send.</div>
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
