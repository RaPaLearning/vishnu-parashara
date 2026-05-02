import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';

function simulateLongPress(element) {
  fireEvent.pointerDown(element, { clientX: 0, clientY: 0 });
  jest.advanceTimersByTime(500);
}

describe('View toggle gesture', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('switches from shloka view to word view on long-press of shloka area', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    act(() => {
      simulateLongPress(shlokaBox);
    });
    expect(screen.getByLabelText('One name at a time')).toBeInTheDocument();
  });

  it('switches from word view to shloka view on long-press', () => {
    localStorage.setItem('viewMode', 'word');
    render(<App />);
    const main = screen.getByLabelText('One name at a time');
    act(() => {
      simulateLongPress(main);
    });
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });

  it('persists view mode in localStorage when toggled', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    act(() => {
      simulateLongPress(shlokaBox);
    });
    expect(localStorage.getItem('viewMode')).toBe('word');
  });

  it('does not toggle on a tap', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    act(() => {
      fireEvent.pointerDown(shlokaBox, { clientX: 0, clientY: 0 });
      fireEvent.pointerUp(shlokaBox);
    });
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });

  it('does not toggle when pointer moves during hold', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    act(() => {
      fireEvent.pointerDown(shlokaBox, { clientX: 0, clientY: 0 });
      fireEvent.pointerMove(shlokaBox, { clientX: 20, clientY: 0 });
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });
});
