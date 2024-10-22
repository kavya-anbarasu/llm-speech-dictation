const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import CORS

const app = express();
const PORT = 5001;

// Enable CORS for all origins
app.use(cors());

// Multer setup to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Endpoint to handle transcription requests
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    const audioPath = req.file.path;
    const outputPath = `${audioPath}.txt`;

    try {
        // Command to run Whisper for transcription
        const whisperCommand = `whisper ${audioPath} --model small --output_dir uploads/`;

        // Execute the Whisper command
        exec(whisperCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing Whisper:', error);
                return res.status(500).json({ error: 'Failed to transcribe audio' });
            }

            // Read the transcription from the generated text file
            fs.readFile(outputPath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading transcription file:', err);
                    return res.status(500).json({ error: 'Failed to read transcription' });
                }

                // Send the transcription back to the client
                res.json({ transcription: data });

                // Clean up the uploaded audio file and transcription
                fs.unlinkSync(audioPath);
                fs.unlinkSync(outputPath);
            });
        });

    } catch (error) {
        console.error('Error during transcription:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
