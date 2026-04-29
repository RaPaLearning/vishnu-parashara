import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';

function simulateDoubleTap(element) {
  fireEvent.click(element);
  fireEvent.click(element);
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

  it('switches from shloka view to word view on double-tap of shloka area', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    act(() => {
      simulateDoubleTap(shlokaBox);
    });
    expect(screen.getByLabelText('One name at a time')).toBeInTheDocument();
  });

  it('switches from word view to shloka view on double-tap', () => {
    localStorage.setItem('viewMode', 'word');
    render(<App />);
    const main = screen.getByLabelText('One name at a time');
    act(() => {
      simulateDoubleTap(main);
    });
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });

  it('persists view mode in localStorage when toggled', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    act(() => {
      simulateDoubleTap(shlokaBox);
    });
    expect(localStorage.getItem('viewMode')).toBe('word');
  });

  it('does not toggle on single tap', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    act(() => {
      fireEvent.click(shlokaBox);
    });
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });

  it('does not toggle when clicks are more than 300ms apart', () => {
    render(<App />);
    const shlokaBox = document.querySelector('.shloka-box');
    act(() => {
      fireEvent.click(shlokaBox);
      jest.advanceTimersByTime(301);
      fireEvent.click(shlokaBox);
    });
    expect(screen.getByText('विश्वं')).toBeInTheDocument();
  });
});
