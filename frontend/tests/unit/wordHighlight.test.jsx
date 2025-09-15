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

  it('does not move word when highlighted', () => {
    render(<App />);
    const word = screen.getByText('विश्वं');
    // Record initial position
    const rectBefore = word.getBoundingClientRect();
    fireEvent.click(word);
    const rectAfter = word.getBoundingClientRect();
    // Allow a 1px tolerance for rendering differences
    expect(Math.abs(rectBefore.top - rectAfter.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(rectBefore.left - rectAfter.left)).toBeLessThanOrEqual(1);
  });
});
