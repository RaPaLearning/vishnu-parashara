
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
          margin: '1.5rem 0 1.5rem 2rem',
          padding: '1rem',
          minWidth: 220,
          maxWidth: 340,
          background: 'var(--meaning-bg, #f8f9fa)',
          borderRadius: '0.5em',
          boxShadow: '0 2px 8px 0 #0001',
          textAlign: 'left',
          color: 'var(--meaning-color, #222)'
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{word}</div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{meaning}</div>
        <div style={{ fontSize: '0.98rem', color: '#555' }}>{commentary}</div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <div style={{ fontSize: '2.5rem', color: '#3b3b3b', marginBottom: '0.5rem' }}>
        {'श्री'}
      </div>
      <h1 style={{ fontFamily: 'serif', fontWeight: 700 }}>Vishnu Sahasranama</h1>
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          flexDirection: 'row',
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
            maxHeight: `calc(100vh - 7rem)`,
            overflowY: 'auto'
          }}
        >
          {Array.from({ length: numberOfShlokas() }, (_, i) => i + 1).map((shlokaNum) => (
            <div key={shlokaNum} style={{ marginBottom: '2rem', width: '100%' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Shloka {shlokaNum}</div>
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

export default App
