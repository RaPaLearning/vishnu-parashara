import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';

function getViewToggleButton() {
  return document.querySelector('.view-toggle-button');
}

describe('View toggle button', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts in shloka view by default', () => {
    render(<App />);
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });

  it('starts in word view when localStorage viewMode is word', () => {
    localStorage.setItem('viewMode', 'word');
    render(<App />);
    expect(screen.getByLabelText('One name at a time')).toBeInTheDocument();
  });

  it('shows the view toggle button in the shloka view', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /switch to word-by-word view/i })).toBeInTheDocument();
  });

  it('switches from shloka view to word view on clicking the toggle button', () => {
    render(<App />);
    fireEvent.click(getViewToggleButton());
    expect(screen.getByLabelText('One name at a time')).toBeInTheDocument();
  });

  it('switches from word view to shloka view on clicking the toggle button', () => {
    localStorage.setItem('viewMode', 'word');
    render(<App />);
    fireEvent.click(getViewToggleButton());
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });

  it('persists view mode in localStorage when toggled', () => {
    render(<App />);
    fireEvent.click(getViewToggleButton());
    expect(localStorage.getItem('viewMode')).toBe('word');
  });

  it('does not toggle when tapping the shloka area', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    fireEvent.pointerDown(shlokaBox, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(shlokaBox);
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });
});
