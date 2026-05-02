/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { getWordMeaningAndCommentary, getWordsForShlokaLine, numberOfShlokas } from '../data';
import { lineEndings } from '../nameEntries';
import { transliterate } from '../transliterate';
import { useLongPress } from '../useLongPress';
import MeaningPanel from './MeaningPanel';
import ScriptSelector from './ScriptSelector';

function DesktopSahasranama({
  selectedScript,
  onScriptChange,
  context,
  setContext,
  onCopyContext,
  onLaunchChatGPT,
  onToggleView
}) {
  const [highlighted, setHighlighted] = useState({ shloka: null, line: null, idx: null });

  useEffect(() => {
    const saved = localStorage.getItem('highlightedWord');
    if (!saved) {
      return;
    }

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
  }, []);

  const handleHighlight = (shloka, line, idx) => {
    setHighlighted({ shloka, line, idx });
    setContext('');
    localStorage.setItem('highlightedWord', JSON.stringify({ shloka, line, idx }));
  };

  const longPressHandlers = useLongPress(onToggleView);

  const formatWordsInShlokaLine = (shlokaNum, lineNum) => (
    <>
      {getWordsForShlokaLine(shlokaNum, lineNum).map((word, idx) => {
        const isHighlighted =
          highlighted.shloka === shlokaNum &&
          highlighted.line === lineNum &&
          highlighted.idx === idx;
        const displayWord = transliterate(word, selectedScript);
        return (
          <span
            className={isHighlighted ? 'highlight-word' : undefined}
            key={idx}
            onClick={() => handleHighlight(shlokaNum, lineNum, idx)}
          >
            {displayWord}
          </span>
        );
      })}
      <span>{transliterate(lineEndings[lineNum - 1](shlokaNum), selectedScript)}</span>
    </>
  );

  const explanationContent = () => {
    if (!highlighted.shloka || !highlighted.line || highlighted.idx === null) {
      return { word: '', meaning: '', commentary: '' };
    }

    const words = getWordsForShlokaLine(highlighted.shloka, highlighted.line);
    const word = words[highlighted.idx];
    const displayWord = transliterate(word, selectedScript);
    const { meaning, commentary } = getWordMeaningAndCommentary(
      highlighted.shloka,
      highlighted.line,
      highlighted.idx
    );
    return { word: displayWord, meaning, commentary };
  };

  const { word, meaning, commentary } = explanationContent();

  return (
    <>
      <div className="shloka-box" {...longPressHandlers}>
        <ScriptSelector
          className="script-selector-row"
          selectedScript={selectedScript}
          onScriptChange={onScriptChange}
        />
        {Array.from({ length: numberOfShlokas() }, (_, i) => i + 1).map((shlokaNum) => (
          <div key={shlokaNum} data-shloka={shlokaNum}>
            {[1, 2].map((lineNum) => (
              <div key={lineNum}>{formatWordsInShlokaLine(shlokaNum, lineNum)}</div>
            ))}
            <div className="shloka-gap"></div>
          </div>
        ))}
      </div>
      <MeaningPanel
        word={word}
        meaning={meaning}
        commentary={commentary}
        context={context}
        onChatClick={() => {
          if (context.length === 0) {
            onCopyContext(highlighted.shloka, highlighted.line, highlighted.idx);
          } else {
            onLaunchChatGPT();
          }
        }}
        onLaunchChatGPT={onLaunchChatGPT}
      />
    </>
  );
}

export default DesktopSahasranama;
