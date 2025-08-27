
import './App.css';
import { useEffect, useState } from 'react';
import { fetchSahasranama } from './sahasranamaService';


function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSahasranama()
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Vishnu Sahasranama</h1>
      </header>
      <main style={{ padding: '2rem' }}>
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {data.length === 0 && !error && <div>Loading...</div>}
        {data.map((item, idx) => (
          <section key={idx} style={{ marginBottom: '2rem', background: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
            <h2>Shloka {idx + 1}</h2>
            <pre style={{ fontSize: '1.2rem', fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{item.shloka}</pre>
            <ul>
              {item.names.map((n, i) => (
                <li key={i} style={{ marginBottom: '1rem' }}>
                  <strong>{n.name}</strong>: {n.meaning}
                  <div style={{ fontStyle: 'italic', color: '#555' }}>{n.explanation}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

export default App;
