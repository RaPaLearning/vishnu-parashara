/* eslint-disable react/prop-types */
function MeaningPanel({ word, meaning, commentary, context, onChatClick, onLaunchChatGPT }) {
  return (
    <div className="meaning-box">
      <div data-testid="meaning-container">
        <div className="meaning-word">
          {word ? word : 'Click on a name to see its commentary.'}
        </div>
        <div className="meaning-text" style={{ whiteSpace: 'normal' }}>{meaning}</div>
        <div>
          {commentary.split('\n').map((line, idx) => (
            <div className="commentary-line" key={idx}>{line}</div>
          ))}
        </div>
      </div>
      {word && (
        <div className="chat-row">
          <button className="highlight-word" aria-label="Chat" onClick={onChatClick}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          {context.length > 0 && (
            <div className="chat-launch" onClick={onLaunchChatGPT}>
              <div>Prompt copied. Paste in an AI chat.</div>
              <div className="chat-launch-link">
                Or click to launch in chatgpt.com. Press send there
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MeaningPanel;
