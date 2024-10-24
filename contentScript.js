// Content script to implement dictation with buttons for start, stop, and copy functionality
console.log('Content script loaded, trying to create the buttons.');

// Create the buttons
const dictationButton = document.createElement('button');
dictationButton.textContent = 'Start Recording';

dictationButton.style.position = 'fixed';
dictationButton.style.bottom = '20px';
dictationButton.style.left = '20px'; // Move button to bottom left
dictationButton.style.padding = '10px 20px';
dictationButton.style.backgroundColor = '#007bff'; // Start Recording - blue
dictationButton.style.color = '#fff';
dictationButton.style.border = 'none';
dictationButton.style.borderRadius = '5px';
dictationButton.style.zIndex = '1000';

// Append the button to the document body
if (document.body) {
    document.body.appendChild(dictationButton);
    console.log('Button appended to body successfully.');
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
                const response = await fetch('http://localhost:5001/api/transcribe', {
                    method: 'POST',
                    body: formData
                });
            
                const data = await response.json();
                if (data.correctedTranscription) {
                    // Extract and clean corrected transcription
                    transcriptionText = data.correctedTranscription.trim();
                    console.log(`Enhanced Transcription: ${transcriptionText}`);
                
                    // Automatically copy corrected transcription to clipboard
                    try {
                        await navigator.clipboard.writeText(transcriptionText);
                        console.log('Corrected transcription copied to clipboard. Ready to paste.');
                
                        // Send message to background script to store transcription
                        storeTranscription(transcriptionText);
                    } catch (error) {
                        console.error('Failed to store transcription to popup:', error);
                    }
                
                    // Reset button to "Start Recording" after copying
                    resetButtonState();
                } else {
                    console.error('Error in transcription response:', data);
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
