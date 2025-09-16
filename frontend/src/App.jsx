
import './App.css';
import { useState } from 'react';
import { getWordsForShlokaLine, getWordMeaningAndCommentary, numberOfShlokas } from './data';

function App() {
  const [highlighted, setHighlighted] = useState({ shloka: null, line: null, idx: null });

  const handleHighlight = (shloka, line, idx) => {
    setHighlighted({ shloka, line, idx });
  };

  let meaningBox = null;
  if (
    highlighted.shloka &&
    highlighted.line &&
    highlighted.idx !== null
  ) {
    const words = getWordsForShlokaLine(highlighted.shloka, highlighted.line);
    const word = words[highlighted.idx];
    const { meaning, commentary } = getWordMeaningAndCommentary(
      highlighted.shloka,
      highlighted.line,
      highlighted.idx
    );
    meaningBox = (
      <div
        data-testid="meaning-box"
        style={{
          margin: '1.0rem 0 1.0rem 0.5rem',
          padding: '1rem',
          minWidth: 220,
          background: 'var(--meaning-bg, #f8f9fa)',
          borderRadius: '0.5em',
          boxShadow: '0 2px 8px 0 #0001',
          textAlign: 'left',
          color: 'var(--meaning-color, #222)'
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{word}</div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{meaning}</div>
        <div style={{ fontSize: '0.98rem', color: '#555' }}>
          {commentary.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    );
  }

  console.log(`innerHeight: ${window.innerHeight}, innerWidth: ${window.innerWidth}`);
  const isPortrait = window.innerHeight > window.innerWidth;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', color: '#3b3b3b' }}>
      {'श्री'}
      </div>
      <div
      style={{
        marginTop: '2rem',
        display: 'flex',
        flexDirection: isPortrait ? 'column' : 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '2rem',
        width: '100%'
      }}
      >
      <div
        style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 340,
        maxWidth: 600,
        maxHeight: isPortrait ? `calc(100vh - 20rem)` : `calc(100vh - 8rem)`,
        overflowY: 'auto'
        }}
      >
        {Array.from({ length: numberOfShlokas() }, (_, i) => i + 1).map((shlokaNum) => (
        <div key={shlokaNum} style={{ marginBottom: '2rem', width: '100%' }}>
          {[1, 2].map((lineNum) => (
          <div key={lineNum} style={{ fontSize: '1.3rem', margin: '0.2rem 0' }}>
            {getWordsForShlokaLine(shlokaNum, lineNum).map((word, idx) => {
            const isHighlighted =
              highlighted.shloka === shlokaNum &&
              highlighted.line === lineNum &&
              highlighted.idx === idx;
            return (
              <span
              key={idx}
              style={{
                margin: '0 0.5rem',
                backgroundColor: isHighlighted
                ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                  ? '#ffe06633' // semi-transparent yellow for dark mode
                  : '#ffe066')
                : undefined,
                color: isHighlighted ? '#222' : undefined,
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
          </div>
          ))}
        </div>
        ))}
      </div>
      <div style={{ minWidth: 340, maxWidth: 340 }}>
        {meaningBox}
      </div>
      </div>
    </div>
    );
}

const lineEndings = [
  () => '।', (shlokaNum) => `॥ ${shlokaNum} ॥`
];

export default App
