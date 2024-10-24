// Content script to implement dictation with buttons for start, stop, and copy functionality
console.log('Content script loaded, trying to create the buttons.');

// Create the buttons
const dictationButton = document.createElement('button');
dictationButton.textContent = 'Start Recording';

const llmToggle = document.createElement('input');
llmToggle.type = 'checkbox';
llmToggle.id = 'llmToggle';
llmToggle.style.position = 'fixed';
llmToggle.style.bottom = '20px';
llmToggle.style.left = '150px'; // Move toggle to the right of the button
llmToggle.style.zIndex = '1000';

const toggleLabel = document.createElement('label');
toggleLabel.htmlFor = 'llmToggle';
toggleLabel.textContent = 'Use LLM Correction';
toggleLabel.style.position = 'fixed';
toggleLabel.style.bottom = '20px';
toggleLabel.style.left = '180px'; // Move label to the right of the toggle
toggleLabel.style.zIndex = '1000';

// Style dictation button
dictationButton.style.position = 'fixed';
dictationButton.style.bottom = '20px';
dictationButton.style.left = '20px'; // Move button to bottom left
dictationButton.style.padding = '10px 20px';
dictationButton.style.backgroundColor = '#007bff'; // Start Recording - blue
dictationButton.style.color = '#fff';
dictationButton.style.border = 'none';
dictationButton.style.borderRadius = '5px';
dictationButton.style.zIndex = '1000';

// Append the button, toggle, and label to the document body
if (document.body) {
    document.body.appendChild(dictationButton);
    document.body.appendChild(llmToggle);
    document.body.appendChild(toggleLabel);
    console.log('Button and toggle appended to body successfully.');
} else {
    console.error('document.body is not available.');
}

let mediaRecorder;
let audioChunks = [];
let transcriptionText = '';

// Add click listener to the button
dictationButton.addEventListener('click', function () {
    if (dictationButton.textContent === 'Start Recording') {
        startDictation();
    } else if (dictationButton.textContent === 'Stop Recording') {
        stopDictation();
    }
});

// Function to start dictation
async function startDictation() {
    console.log('Start dictation triggered');

    try {
        // Get user's microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            console.log('Audio recording complete.');

            dictationButton.textContent = 'Processing';
            dictationButton.style.backgroundColor = '#ffc107'; // Processing - yellow

            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');

            try {
                // Transcribe the audio using Whisper
                const response = await fetch('http://localhost:5001/api/transcribe', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (llmToggle.checked) {
                    // If LLM correction is enabled, send to `/api/correct` endpoint
                    if (data.originalTranscription) {
                        transcriptionText = data.originalTranscription.trim();
                        console.log(`Original Transcription: ${transcriptionText}`);

                        // Pass the transcription to LLM correction
                        await correctTranscription(transcriptionText);
                    } else {
                        console.error('Unexpected response format:', data);
                        resetButtonState();
                    }
                } else if (data.originalTranscription) {
                    // If LLM correction is not enabled, use original transcription
                    transcriptionText = data.originalTranscription.trim();
                    console.log(`Original Transcription: ${transcriptionText}`);

                    // Automatically copy and store transcription
                    await copyAndStoreTranscription(transcriptionText);
                    resetButtonState();
                } else {
                    console.error('Unexpected response format:', data);
                    resetButtonState();
                }
            } catch (error) {
                console.error('Error sending audio to backend:', error);
                resetButtonState();
            }
        };

        // Start recording
        mediaRecorder.start();
        dictationButton.textContent = 'Stop Recording';
        dictationButton.style.backgroundColor = '#dc3545'; // Stop Recording - red
        console.log('Recording started...');
    } catch (error) {
        console.error('Error accessing microphone:', error);
        resetButtonState();
    }
}

// Function to stop dictation
function stopDictation() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log('Recording stopped...');
    }
}

// Function to correct transcription using Llama-7B
async function correctTranscription(transcription) {
    dictationButton.textContent = 'Correcting';
    dictationButton.style.backgroundColor = '#ffc107'; // Correcting - yellow

    try {
        const response = await fetch('http://localhost:5001/api/correct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transcription }),
        });

        const data = await response.json();
        if (data.correctedTranscription) {
            transcriptionText = data.correctedTranscription.trim();
            console.log(`Enhanced Transcription: ${transcriptionText}`);

            // Automatically copy corrected transcription to clipboard and store it
            await copyAndStoreTranscription(transcriptionText);

            // Reset button to "Start Recording" after copying
            resetButtonState();
        } else {
            console.error('Unexpected response format:', data);
            resetButtonState();
        }
    } catch (error) {
        console.error('Error sending transcription for correction:', error);
        resetButtonState();
    }
}

// Function to copy transcription to clipboard and store it
async function copyAndStoreTranscription(transcription) {
    try {
        await navigator.clipboard.writeText(transcription);
        console.log('Transcription copied to clipboard. Ready to paste.');

        // Send message to background script to store transcription
        storeTranscription(transcription);
    } catch (error) {
        console.error('Failed to store transcription to clipboard:', error);
    }
}

// Function to reset button state back to "Start Recording"
function resetButtonState() {
    dictationButton.textContent = 'Start Recording';
    dictationButton.style.backgroundColor = '#007bff'; // Start Recording - blue
}

// Function to send transcription to the background script for storage
function storeTranscription(transcription, retries = 3) {
    chrome.runtime.sendMessage({ type: 'STORE_TRANSCRIPTION', transcription }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending transcription to background script:', chrome.runtime.lastError.message);

            // Retry logic if there are retries left
            if (retries > 0) {
                console.log(`Retrying to store transcription... (${retries} retries left)`);
                setTimeout(() => {
                    storeTranscription(transcription, retries - 1);
                }, 1000);
            } else {
                console.error('Failed to store transcription after multiple retries.');
            }
        } else if (response && response.success) {
            console.log('Transcription successfully stored.');
        } else {
            console.error('Failed to store transcription.');
        }
    });
}
