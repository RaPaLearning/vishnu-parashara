function ViewToggleButton({ onClick, label, className = '' }) {
  return (
    <button
      type="button"
      className={`view-toggle-button ${className}`.trim()}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="16.5" x2="13" y2="16.5" />
      </svg>
    </button>
  );
}

export default ViewToggleButton;
