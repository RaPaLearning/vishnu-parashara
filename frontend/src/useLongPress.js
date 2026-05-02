import { useRef, useCallback } from 'react';

const LONG_PRESS_DELAY_MS = 500;
const MOVE_THRESHOLD_PX = 10;

export function useLongPress(callback) {
  const timerRef = useRef(null);
  const startPosRef = useRef(null);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const start = useCallback(
    (e) => {
      startPosRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => {
        callback();
        timerRef.current = null;
      }, LONG_PRESS_DELAY_MS);
    },
    [callback]
  );

  const move = useCallback(
    (e) => {
      if (!startPosRef.current) return;
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        cancel();
      }
    },
    [cancel]
  );

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerMove: move,
    onPointerCancel: cancel,
  };
}
