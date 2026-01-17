import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the Devanagari श्री symbol', () => {
    render(<App />);
    expect(screen.getByText('श्री')).toBeInTheDocument();
  });

  it('renders the Kannada ಶ್ರೀ symbol', () => {
    render(<App />);
    expect(screen.getByText('ಶ್ರೀ')).toBeInTheDocument();
  });
});
