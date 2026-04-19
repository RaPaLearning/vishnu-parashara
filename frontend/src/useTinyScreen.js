import { useEffect, useState } from 'react';

const tinyScreenQuery = '(max-width: 320px), (max-height: 340px)';

export function useTinyScreen() {
  const [isTinyScreen, setIsTinyScreen] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }

    return window.matchMedia(tinyScreenQuery).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(tinyScreenQuery);
    const updateTinyScreen = () => setIsTinyScreen(mediaQuery.matches);
    updateTinyScreen();

    mediaQuery.addEventListener('change', updateTinyScreen);
    return () => mediaQuery.removeEventListener('change', updateTinyScreen);
  }, []);

  return isTinyScreen;
}
