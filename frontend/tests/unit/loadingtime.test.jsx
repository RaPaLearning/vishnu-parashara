import { render } from '@testing-library/react';
import fs from 'fs';

describe('App loading time', () => {
  it('loads within impatience threshold', async () => {
    const importStart = performance.now();
    const { default: ImportedApp } = await import('../../src/App');
    const importEnd = performance.now();
    const renderStart = performance.now();
    render(<ImportedApp />);
    const renderEnd = performance.now();
    const importTime = importEnd - importStart;
    const renderTime = renderEnd - renderStart;
    const totalTime = importTime + renderTime;
    const tableHeader = '| Import Time | Render Time | Total Time |\n|---|---|---|\n';
    const row = `| ${importTime.toFixed(1)}ms | ${renderTime.toFixed(1)}ms | ${totalTime.toFixed(1)}ms |\n`;
    fs.writeFileSync('loading-times.md', tableHeader + row);
    expect(totalTime).toBeLessThan(750);
  });
});
