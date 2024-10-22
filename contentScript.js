console.log('Content script loaded, trying to create the button.');

// Create the button
const dictationButton = document.createElement('button');
dictationButton.textContent = 'Start Dictation';

// Apply styles to the button
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

// Add click listener to the button
dictationButton.addEventListener('click', function () {
    startDictation();
});

// Function to start dictation
async function startDictation() {
    console.log('Start dictation triggered');
    
    try {
        // Get user's microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        let audioChunks = [];

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
                    alert(`Transcription: ${data.transcription}`);
                } else {
                    console.error('Error in transcription response:', data);
                }
            } catch (error) {
                console.error('Error sending audio to backend:', error);
            }
        };

        // Start recording
        mediaRecorder.start();
        console.log('Recording started...');
        
        // Stop recording after 5 seconds (for demo purposes)
        setTimeout(() => {
            mediaRecorder.stop();
        }, 5000);

    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}
