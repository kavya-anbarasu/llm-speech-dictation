const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());

// Test endpoint for basic connectivity
app.get('/api/test', (req, res) => {
	res.send('Server is running!');
  });

// Placeholder for Whisper and LLM integration
app.post('/api/start-dictation', (req, res) => {
	console.log('POST request received at /api/start-dictation');
	// Call Whisper for transcription (stubbed for now)
	const transcription = 'Hello, my name is Jon Doe';

	// Call LLM for proper-noun correction (stubbed for now)
	const corrections = ['John Doe'];

	res.json({ transcription, corrections });
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
