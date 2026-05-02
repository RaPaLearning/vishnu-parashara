/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef } from 'react';
import { getAllNameEntries, isSameEntry } from '../nameEntries';
import { transliterate } from '../transliterate';
import { useLongPress } from '../useLongPress';
import ScriptSelector from './ScriptSelector';

function getSavedEntry() {
  const saved = localStorage.getItem('highlightedWord');
  if (!saved) {
    return null;
  }

  try {
    const parsed = JSON.parse(saved);
    if (
      parsed &&
      typeof parsed.shloka === 'number' &&
      typeof parsed.line === 'number' &&
      typeof parsed.idx === 'number'
    ) {
      return parsed;
    }
  } catch {
    console.error('Failed to parse saved highlighted word from localStorage');
  }

  return null;
}

function TinySahasranama({ selectedScript, onScriptChange, onToggleView }) {
  const entries = useMemo(() => getAllNameEntries(), []);
  const savedEntry = useMemo(() => getSavedEntry(), []);
  const savedEntryRef = useRef(null);

  useEffect(() => {
    if (savedEntryRef.current) {
      savedEntryRef.current.scrollIntoView({ block: 'start' });
    }
  }, []);

  const longPressHandlers = useLongPress(onToggleView);

  return (
    <main className="tiny-sahasranama" aria-label="One name at a time" {...longPressHandlers}>
      <ScriptSelector
        className="tiny-script-selector"
        selectedScript={selectedScript}
        onScriptChange={onScriptChange}
      />
      <div className="tiny-name-track">
        {entries.map((entry, index) => {
          const isSavedEntry = savedEntry && isSameEntry(entry, savedEntry);
          return (
            <article
              className="tiny-name-card"
              key={`${entry.shloka}-${entry.line}-${entry.idx}`}
              ref={isSavedEntry ? savedEntryRef : null}
              tabIndex={0}
              onFocus={() => {
                localStorage.setItem(
                  'highlightedWord',
                  JSON.stringify({ shloka: entry.shloka, line: entry.line, idx: entry.idx })
                );
              }}
            >
              <div className="tiny-count">{index + 1}</div>
              <h1>{transliterate(entry.word, selectedScript)}</h1>
              <p className="tiny-location">
                {entry.shloka}.{entry.line}.{entry.idx + 1}
              </p>
              <p className="tiny-meaning">{entry.meaning}</p>
              <div className="tiny-commentary">
                {entry.commentary.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default TinySahasranama;
