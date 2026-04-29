import './App.css';
import { useState } from 'react';
import DesktopSahasranama from './components/DesktopSahasranama';
import TinySahasranama from './components/TinySahasranama';
import { promptWithContext } from './prompt';
import { getSavedScript, saveScript } from './transliterate';

function getSavedViewMode() {
  return localStorage.getItem('viewMode') === 'word';
}

function App() {
  const [selectedScript, setSelectedScript] = useState(getSavedScript());
  const [context, setContext] = useState('');
  const [isWordView, setIsWordView] = useState(getSavedViewMode);

  const handleScriptChange = (script) => {
    setSelectedScript(script);
    saveScript(script);
  };

  const toggleView = () => {
    setIsWordView((prev) => {
      const next = !prev;
      localStorage.setItem('viewMode', next ? 'word' : 'shloka');
      return next;
    });
  };

  const copyContext = (shlokaNum, lineNum, wordIndex) => {
    const textToCopy = promptWithContext(shlokaNum, lineNum, wordIndex);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setContext(textToCopy);
    });
  };

  const launchChatGPT = () => {
    window.open(`https://chatgpt.com/?prompt=${encodeURIComponent(context)}`);
  };

  if (isWordView) {
    return (
      <TinySahasranama
        selectedScript={selectedScript}
        onScriptChange={handleScriptChange}
        onToggleView={toggleView}
      />
    );
  }

  return (
    <DesktopSahasranama
      selectedScript={selectedScript}
      onScriptChange={handleScriptChange}
      context={context}
      setContext={setContext}
      onCopyContext={copyContext}
      onLaunchChatGPT={launchChatGPT}
      onToggleView={toggleView}
    />
  );
}

export default App;
