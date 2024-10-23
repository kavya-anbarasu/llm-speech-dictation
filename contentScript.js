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
    } else if (dictationButton.textContent === 'Copy Transcription') {
        copyTranscription();
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
                if (data.transcription) {
                    transcriptionText = data.transcription;
                    console.log(`Transcription: ${transcriptionText}`);
        
                    // Automatically copy transcription to clipboard
                    await navigator.clipboard.writeText(transcriptionText);
                    console.log('Transcription copied to clipboard. Ready to paste.');
        
                    // Update button state back to "Start Recording"
                    dictationButton.textContent = 'Start Recording';
                    dictationButton.style.backgroundColor = '#007bff'; // Start Recording - blue
        
                    // Store transcription in chrome storage
                    storeTranscription();
                } else {
                    console.error('Error in transcription response:', data);
                    // Handle error, reset button to "Start Recording"
                    resetButtonState();
                }
            } catch (error) {
                console.error('Error sending audio to backend:', error);
                // Handle error, reset button to "Start Recording"
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
        // Handle error, reset button to "Start Recording"
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


// Function to store transcription in chrome.storage
const storeTranscription = () => {
    chrome.storage.local.get({ transcriptionHistory: [] }, (result) => {
        const updatedHistory = result.transcriptionHistory;
        updatedHistory.push(transcriptionText); // Add the new transcription
        chrome.storage.local.set({ transcriptionHistory: updatedHistory }, () => {
            console.log('Transcription saved to chrome storage.');
        });
    });
};
