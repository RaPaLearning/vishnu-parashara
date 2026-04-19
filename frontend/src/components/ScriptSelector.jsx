/* eslint-disable react/prop-types */
import { SCRIPT_LABELS } from '../transliterate';

function ScriptSelector({ selectedScript, onScriptChange, className = '' }) {
  return (
    <div className={className}>
      {Object.entries(SCRIPT_LABELS).map(([script, label]) => (
        <button
          key={script}
          className={selectedScript === script ? 'script-selector selected' : 'script-selector'}
          onClick={() => onScriptChange(script)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default ScriptSelector;
