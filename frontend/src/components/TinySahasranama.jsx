import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllNameEntries, isSameEntry } from '../nameEntries';
import { transliterate } from '../transliterate';
import { useLongPress } from '../useLongPress';
import ScriptSelector from './ScriptSelector';

const PEEK_RANGE = 3;
const WHEEL_THRESHOLD = 40;
const DRAG_THRESHOLD_PX = 60;
const MOVE_CANCEL_PX = 10;
const NAV_COOLDOWN_MS = 350;
const NEXT_KEYS = new Set(['ArrowDown', 'ArrowRight', 'PageDown', ' ']);
const PREV_KEYS = new Set(['ArrowUp', 'ArrowLeft', 'PageUp']);

function isValidEntrySelection(parsed) {
  return Boolean(
    parsed &&
      typeof parsed.shloka === 'number' &&
      typeof parsed.line === 'number' &&
      typeof parsed.idx === 'number'
  );
}

function loadSavedIndex(entries) {
  try {
    const saved = JSON.parse(localStorage.getItem('highlightedWord') ?? 'null');
    if (isValidEntrySelection(saved)) {
      const found = entries.findIndex((entry) => isSameEntry(entry, saved));
      if (found >= 0) {
        return found;
      }
    }
  } catch {
    console.error('Failed to parse saved highlighted word from localStorage');
  }
  return 0;
}

function TinySahasranama({ selectedScript, onScriptChange, onToggleView }) {
  const entries = useMemo(() => getAllNameEntries(), []);
  const [index, setIndex] = useState(() => loadSavedIndex(entries));

  const indexRef = useRef(index);
  const suppressClickRef = useRef(false);
  const wheelAccRef = useRef(0);
  const lastNavRef = useRef(0);
  const dragRef = useRef(null);
  const carouselRef = useRef(null);

  const goTo = useCallback(
    (target) => {
      const clamped = Math.max(0, Math.min(entries.length - 1, target));
      if (clamped === indexRef.current) {
        return;
      }
      const now = Date.now();
      if (now - lastNavRef.current < NAV_COOLDOWN_MS) {
        return;
      }
      lastNavRef.current = now;
      indexRef.current = clamped;
      const entry = entries[clamped];
      localStorage.setItem(
        'highlightedWord',
        JSON.stringify({ shloka: entry.shloka, line: entry.line, idx: entry.idx })
      );
      setIndex(clamped);
    },
    [entries]
  );

  const goNext = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  // Animate the elastic drag offset back to rest.
  const resetDragOffset = useCallback((animate) => {
    const stack = carouselRef.current;
    if (!stack) {
      return;
    }
    stack.style.transition = animate ? 'transform 0.2s ease' : 'none';
    stack.style.transform = 'translateY(0)';
  }, []);

  // Window-level listeners let the drag continue outside the carousel.
  useEffect(() => {
    const onPointerMove = (e) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) {
        return;
      }
      const dy = e.clientY - drag.startY;
      if (Math.abs(dy) > MOVE_CANCEL_PX) {
        drag.moved = true;
      }
      const stack = carouselRef.current;
      if (stack) {
        stack.style.transition = 'none';
        stack.style.transform = `translateY(${dy * 0.35}px)`;
      }
    };

    const onPointerUp = (e) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) {
        return;
      }
      dragRef.current = null;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dy) > DRAG_THRESHOLD_PX) {
        suppressClickRef.current = true;
        if (dy < 0) {
          goNext();
        } else {
          goPrev();
        }
      }
      resetDragOffset(true);
    };

    const onPointerCancel = (e) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) {
        return;
      }
      dragRef.current = null;
      resetDragOffset(true);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [goNext, goPrev, resetDragOffset]);

  const {
    onPointerDown: lpDown,
    onPointerUp: lpUp,
    onPointerMove: lpMove,
    onPointerCancel: lpCancel
  } = useLongPress(() => {
    suppressClickRef.current = true;
    onToggleView();
  });

  const handlePointerDown = (e) => {
    suppressClickRef.current = false;
    lpDown(e);
    dragRef.current = { pointerId: e.pointerId, startY: e.clientY };
  };

  const handlePointerMove = (e) => {
    lpMove(e);
  };

  const handlePointerUp = (e) => {
    lpUp(e);
  };

  const handlePointerCancel = (e) => {
    lpCancel(e);
  };

  const handleWheel = (e) => {
    wheelAccRef.current += e.deltaY;
    if (Math.abs(wheelAccRef.current) > WHEEL_THRESHOLD) {
      const direction = wheelAccRef.current > 0 ? 1 : -1;
      wheelAccRef.current = 0;
      goTo(indexRef.current + direction);
    }
  };

  const handleClick = (e) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (e.target.closest('.script-selector')) {
      return;
    }
    const direction = e.target.closest('[data-peek-direction="prev"]') ? -1 : 1;
    goTo(indexRef.current + direction);
  };

  const handleKeyDown = (e) => {
    if (NEXT_KEYS.has(e.key)) {
      e.preventDefault();
      goNext();
    } else if (PREV_KEYS.has(e.key)) {
      e.preventDefault();
      goPrev();
    }
  };

  const offsets = [];
  for (let offset = -PEEK_RANGE; offset <= PEEK_RANGE; offset += 1) {
    offsets.push(offset);
  }

  return (
    <main
      className="tiny-sahasranama"
      aria-label="One name at a time"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <ScriptSelector
        className="tiny-script-selector"
        selectedScript={selectedScript}
        onScriptChange={onScriptChange}
      />
      <div className="tiny-carousel" ref={carouselRef}>
        {offsets.map((offset) => {
          const entryIndex = index + offset;
          if (entryIndex < 0 || entryIndex >= entries.length) {
            return null;
          }
          const entry = entries[entryIndex];
          const key = `${entry.shloka}-${entry.line}-${entry.idx}`;

          if (offset === 0) {
            return (
              <article className="tiny-slot tiny-slot-current" key={key}>
                <div className="tiny-count">
                  {entryIndex + 1}
                </div>
                <h1>{transliterate(entry.word, selectedScript)}</h1>
                <p className="tiny-meaning">{entry.meaning}</p>
                <div className="tiny-commentary">
                  {entry.commentary.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </article>
            );
          }

          return (
            <div
              className={`tiny-slot tiny-slot-peek tiny-slot-${offset < 0 ? 'prev' : 'next'}-${Math.abs(offset)}`}
              key={key}
              data-peek-direction={offset < 0 ? 'prev' : 'next'}
              aria-hidden="true"
            >
              <span className="tiny-peek-name">{transliterate(entry.word, selectedScript)}</span>
              <span className="tiny-peek-count">{entryIndex + 1}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default TinySahasranama;
