import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';

describe('Word highlight interaction', () => {
  it('highlights a word on click', () => {
    render(<App />);
    // Find a word from the first shloka
    const word = screen.getByText('विश्वं');
    fireEvent.click(word);
    expect(word).toHaveStyle('background-color: #ffe066');
  });

  it('highlights a word on hover', () => {
    render(<App />);
    const word = screen.getByText('विष्णु');
    fireEvent.mouseOver(word);
    expect(word).toHaveStyle('background-color: #ffe066');
    fireEvent.mouseOut(word);
    expect(word).not.toHaveStyle('background-color: #ffe066');
  });
});
