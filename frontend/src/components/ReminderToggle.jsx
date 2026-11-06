import { useEffect, useState } from 'react';
import {
  disableReminders,
  enableReminders,
  initReminders,
  isRemindersEnabled
} from '../push/reminders';

function ReminderToggle() {
  const [enabled, setEnabled] = useState(isRemindersEnabled);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    initReminders();
  }, []);

  const handleClick = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      if (enabled) {
        await disableReminders();
        setEnabled(false);
      } else {
        await enableReminders();
        setEnabled(true);
      }
    } catch (err) {
      alert(`Could not update name reminders: ${err.name ? `${err.name}: ` : ''}${err.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  const label = enabled
    ? 'Name reminders are on. Click to turn them off'
    : 'Set up name reminders: a notification with the next name every 15 minutes while idle';

  return (
    <button
      type="button"
      className={`view-toggle-button reminder-toggle${enabled ? ' reminder-on' : ''}`}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
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
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    </button>
  );
}

export default ReminderToggle;
