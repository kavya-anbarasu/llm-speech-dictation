const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5001;

app.use(cors());

app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' });

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    const audioPath = req.file.path;
    const outputPath = `${audioPath}.txt`;

    try {
        const whisperCommand = `whisper ${audioPath} --model small --output_dir uploads/`;

        exec(whisperCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing Whisper:', error);
                return res.status(500).json({ error: 'Failed to transcribe audio' });
            }

            fs.readFile(outputPath, 'utf8', (err, transcription) => {
                if (err) {
                    console.error('Error reading transcription file:', err);
                    return res.status(500).json({ error: 'Failed to read transcription' });
                }

                // Send the original transcription back to the client
                res.json({ originalTranscription: transcription.trim() });

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

app.post('/api/correct', async (req, res) => {
    const { transcription } = req.body;

    if (!transcription) {
        return res.status(400).json({ error: 'Transcription text is required' });
    }

    try {
        const tempTranscriptionFile = path.join(__dirname, 'uploads', 'temp_transcription.txt');
        fs.writeFileSync(tempTranscriptionFile, transcription);

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
            res.json({ correctedTranscription: correctedText.trim() });

            // Clean up the temporary transcription file
            fs.unlinkSync(tempTranscriptionFile);
        });

    } catch (error) {
        console.error('Error during LLM correction:', error);
        res.status(500).json({ error: 'Failed to generate corrected transcription' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
