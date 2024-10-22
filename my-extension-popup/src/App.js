import React, { useState } from 'react';
import './App.css';

function App() {
  const [transcription, setTranscription] = useState('');
  const [corrections, setCorrections] = useState([]);

  const handleDictation = async () => {
    try{
      // Placeholder for initiating backend Whisper request
      const response = await fetch('http://localhost:5001/api/start-dictation', {
        method: 'POST',
      });
      const data = await response.json();
      setTranscription(data.transcription);
      setCorrections(data.corrections);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="App">
      <h1>Proper Noun Correction Dictation</h1>
      <button onClick={handleDictation}>Start Dictation</button>
      <div className="transcription">
        <p>Transcription: {transcription}</p>
        {corrections.length > 0 && (
          <div className="corrections">
            <h3>Suggestions:</h3>
            <ul>
              {corrections.map((correction, index) => (
                <li key={index}>{correction}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
