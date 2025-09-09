import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App', () => {
  it('renders the Devanagari श्री symbol', () => {
    render(<App />);
    expect(screen.getByText('श्री')).toBeInTheDocument();
  });

  it('renders the heading Vishnu Sahasranama', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Vishnu Sahasranama/i })).toBeInTheDocument();
  });
});
