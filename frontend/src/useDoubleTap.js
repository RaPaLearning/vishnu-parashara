import { useRef } from 'react';

const DOUBLE_TAP_DELAY_MS = 300;

export function useDoubleTap(callback) {
  const lastTapRef = useRef(0);

  return () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY_MS) {
      callback();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };
}
