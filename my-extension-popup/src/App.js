import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [transcriptionHistory, setTranscriptionHistory] = useState([]);

  // Load transcription history from chrome storage when the component mounts
  useEffect(() => {
    // eslint-disable-next-line no-undef
    chrome.storage.local.get({ transcriptionHistory: [] }, (result) => {
      setTranscriptionHistory(result.transcriptionHistory);
    });
  }, []);

  const clearHistory = () => {
    // eslint-disable-next-line no-undef
    chrome.storage.local.set({ transcriptionHistory: [] }, () => {
      console.log('Transcription history cleared.');
      setTranscriptionHistory([]);
    });
  };

  return (
    <div className="App">
      <h1>Proper Noun Correction Dictation</h1>
      <div className="transcription-history">
        <h3>Transcription History</h3>
        {transcriptionHistory.length > 0 ? (
          <ul>
            {transcriptionHistory.map((text, index) => (
              <li key={index}>{text}</li>
            ))}
          </ul>
        ) : (
          <p>No transcription available.</p>
        )}
        <button onClick={clearHistory}>Clear History</button>
      </div>
    </div>
  );
}

export default App;
