import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';

describe('Word meaning and commentary display', () => {
  it('shows meaning and commentary when a word is highlighted (click)', () => {
    render(<App />);
    const word = screen.getByText('विश्वं');
    fireEvent.click(word);
    expect(screen.getByTestId('meaning-container')).toHaveTextContent('Complete');
    expect(screen.getByTestId('meaning-container')).toHaveTextContent('पूर्णत्वात्');
  });

  it('allows meaning text to wrap while keeping word and commentary nowrap', () => {
    render(<App />);
    const words = screen.getAllByText('विश्वं');
    // Click on the first occurrence (in the shloka)
    fireEvent.click(words[0]);
    
    const meaningContainer = screen.getByTestId('meaning-container');
    const divs = meaningContainer.querySelectorAll('div');
    
    // First div is the word (should inherit nowrap from parent)
    const wordDiv = divs[0];
    expect(wordDiv).toHaveTextContent('विश्वं');
    
    // Second div is the meaning (should have whiteSpace: normal)
    const meaningDiv = divs[1];
    expect(meaningDiv).toHaveTextContent('Complete');
    expect(meaningDiv).toHaveStyle({ whiteSpace: 'normal' });
  });
});
