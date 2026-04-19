import './App.css';
import { useState } from 'react';
import DesktopSahasranama from './components/DesktopSahasranama';
import TinySahasranama from './components/TinySahasranama';
import { promptWithContext } from './prompt';
import { getSavedScript, saveScript } from './transliterate';
import { useTinyScreen } from './useTinyScreen';

function App() {
  const [selectedScript, setSelectedScript] = useState(getSavedScript());
  const [context, setContext] = useState('');
  const isTinyScreen = useTinyScreen();

  const handleScriptChange = (script) => {
    setSelectedScript(script);
    saveScript(script);
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

  if (isTinyScreen) {
    return (
      <TinySahasranama
        selectedScript={selectedScript}
        onScriptChange={handleScriptChange}
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
    />
  );
}

export default App;
