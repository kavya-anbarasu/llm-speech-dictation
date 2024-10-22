// Content script to implement dictation with buttons for start, stop, and paste functionality
console.log('Content script loaded, trying to create the buttons.');

// Create the buttons
const dictationButton = document.createElement('button');
dictationButton.textContent = 'Start Recording';

dictationButton.style.position = 'fixed';
dictationButton.style.bottom = '20px';
dictationButton.style.right = '20px';
dictationButton.style.padding = '10px 20px';
dictationButton.style.backgroundColor = '#007bff';
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
    } else if (dictationButton.textContent === 'Paste Transcription') {
        pasteTranscription();
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

            // Send audioBlob to the backend for processing
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');

            try {
                const response = await fetch('http://localhost:5001/api/transcribe', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.transcription) {
                    transcriptionText = data.transcription;
                    console.log(`Transcription: ${transcriptionText}`);
                    
                    // Automatically copy transcription to clipboard
                    await navigator.clipboard.writeText(transcriptionText);
                    console.log('Transcription copied to clipboard. Ready to paste.');
                    
                    dictationButton.textContent = 'Paste Transcription';
                    dictationButton.style.backgroundColor = '#28a745'; // Change color to green for paste
                } else {
                    console.error('Error in transcription response:', data);
                }
            } catch (error) {
                console.error('Error sending audio to backend:', error);
            }
        };

        // Start recording
        mediaRecorder.start();
        dictationButton.textContent = 'Stop Recording';
        dictationButton.style.backgroundColor = '#ffc107'; // Change color to yellow for recording
        console.log('Recording started...');
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}

// Function to stop dictation
function stopDictation() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log('Recording stopped...');
    }
}

// Function to paste transcription
function pasteTranscription() {
    if (transcriptionText) {
        navigator.clipboard.writeText(transcriptionText).then(() => {
            console.log('Transcription copied to clipboard. Ready to paste.');
            alert('Transcription copied to clipboard. Please paste it where needed using Ctrl+V or Cmd+V.');
            dictationButton.textContent = 'Start Recording';
            dictationButton.style.backgroundColor = '#007bff'; // Reset color to blue for start recording
            transcriptionText = ''; // Reset transcription text for next recording
        }).catch((error) => {
            console.error('Failed to copy transcription to clipboard:', error);
        });
    } else {
        console.warn('No transcription available to paste.');
    }
}
