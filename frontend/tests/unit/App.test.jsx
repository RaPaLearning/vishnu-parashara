import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App', () => {
  it('renders the Devanagari श्री symbol', () => {
    localStorage.clear();
    render(<App />);
    expect(screen.getByText('श्री')).toBeInTheDocument();
  });

  it('renders the Kannada ಶ್ರೀ symbol', () => {
    localStorage.clear();
    render(<App />);
    expect(screen.getByText('ಶ್ರೀ')).toBeInTheDocument();
  });
});
