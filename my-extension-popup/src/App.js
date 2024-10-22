import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [transcriptions, setTranscriptions] = useState([]);

  useEffect(() => {
    // Load saved transcriptions from local storage on component mount
    const savedTranscriptions = JSON.parse(localStorage.getItem('transcriptions')) || [];
    setTranscriptions(savedTranscriptions);
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem('transcriptions');
    setTranscriptions([]);
  };

  return (
    <div className="App">
      <h3>Past Transcriptions</h3>
      <div className="transcription-list">
        {transcriptions.length > 0 ? (
          transcriptions.map((text, index) => (
            <div key={index} className="transcription-item">
              {text}
            </div>
          ))
        ) : (
          <p>No transcriptions available.</p>
        )}
      </div>
      {transcriptions.length > 0 && (
        <button onClick={handleClearHistory}>Clear History</button>
      )}
    </div>
  );
}

export default App;
