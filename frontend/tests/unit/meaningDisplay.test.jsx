import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';

describe('Word meaning and commentary display', () => {
  it('shows meaning and commentary when a word is highlighted (click)', () => {
    render(<App />);
    const word = screen.getByText('विश्वं');
    fireEvent.click(word);
    expect(screen.getByTestId('meaning-box')).toHaveTextContent('Complete');
    expect(screen.getByTestId('meaning-box')).toHaveTextContent('पूर्णत्वात्');
  });

  it('shows meaning and commentary when a word is highlighted (hover)', () => {
    render(<App />);
    const word = screen.getByText('विष्णु');
    fireEvent.mouseOver(word);
    expect(screen.getByTestId('meaning-box')).toHaveTextContent('pervades');
    expect(screen.getByTestId('meaning-box')).toHaveTextContent('वेशनात्');
    fireEvent.mouseOut(word);
    expect(screen.queryByTestId('meaning-box')).toBeNull();
  });
});
