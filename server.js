const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

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
            fs.readFile(outputPath, 'utf8', (err, transcription) => {
                if (err) {
                    console.error('Error reading transcription file:', err);
                    return res.status(500).json({ error: 'Failed to read transcription' });
                }

                // Save transcription to a temporary file for correction
                const tempTranscriptionFile = path.join(__dirname, 'uploads', 'temp_transcription.txt');
                fs.writeFileSync(tempTranscriptionFile, transcription);

                // Use Llama 2 to improve the transcription
                const llmProcess = spawn('python3', ['llama7b_correct.py', tempTranscriptionFile]);

                let correctedText = '';

                llmProcess.stdout.on('data', (data) => {
                    correctedText += data.toString();
                });

                llmProcess.stderr.on('data', (data) => {
                    console.error(`Error from LLM correction: ${data}`);
                });

                llmProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`Llama7B process exited with code ${code}`);
                        return res.status(500).json({ error: 'Failed to generate corrected transcription' });
                    }

                    // Send the corrected transcription back to the client
                    res.json({ 
						originalTranscription: transcription.trim(),
						correctedTranscription: correctedText
					});

                    // Clean up the uploaded audio file, transcription, and temp file
                    fs.unlinkSync(audioPath);
                    fs.unlinkSync(outputPath);
                    fs.unlinkSync(tempTranscriptionFile);
                });
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
