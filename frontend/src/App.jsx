
import './App.css';
import { useState } from 'react';
import { getWordsForShlokaLine, getWordMeaningAndCommentary, numberOfShlokas } from './data';

function App() {
  const [highlighted, setHighlighted] = useState({ shloka: null, line: null, idx: null });

  const handleHighlight = (shloka, line, idx) => {
    setHighlighted({ shloka, line, idx });
  };

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
      <div className='meaning-box'
        data-testid="meaning-box"
      >
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{word}</div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{meaning}</div>
        <div style={{ fontSize: '0.98rem' }}>
          {commentary.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="shloka-box">
      <p style={{ textAlign: 'center', color: 'orange' }}>श्री</p>
      {Array.from({ length: numberOfShlokas() }, (_, i) => i + 1).map((shlokaNum) => (
        <div key={shlokaNum}>
        {[1, 2].map((lineNum) => (
          <div key={lineNum}>{formatWordsInShlokaLine(shlokaNum, lineNum)}</div>
        ))}
        <div style={{ height: '1rem' }}></div>
        </div>
      ))}
      </div>
      <div className="meaning-box">
      <p>{meaningBox}</p>
      </div>
    </>
    );
}

const lineEndings = [
  () => '।', (shlokaNum) => `॥ ${shlokaNum} ॥`
];

export default App
