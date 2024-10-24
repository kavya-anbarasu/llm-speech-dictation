// Content script to implement dictation with buttons for start, stop, and copy functionality
console.log('Content script loaded');

const isOnGmail = window.location.href.includes("mail.google.com");

console.log('Creating dictation button and toggle...');

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

const llmToggleWrapper = document.createElement('div');
llmToggleWrapper.style.display = 'flex';
llmToggleWrapper.style.alignItems = 'center';
llmToggleWrapper.style.position = 'fixed';
llmToggleWrapper.style.bottom = '75px'; // Place toggle on top of the button, with spacing
llmToggleWrapper.style.left = '20px';
llmToggleWrapper.style.zIndex = '1000';

const llmToggle = document.createElement('input');
llmToggle.type = 'checkbox';
llmToggle.id = 'llmToggle';

const toggleLabel = document.createElement('label');
toggleLabel.htmlFor = 'llmToggle';
toggleLabel.textContent = 'Use LLM Correction';
toggleLabel.style.marginLeft = '5px'; // Add spacing between the checkbox and the label

// Append the toggle and label to the wrapper
llmToggleWrapper.appendChild(llmToggle);
llmToggleWrapper.appendChild(toggleLabel);

if (document.body) {
    document.body.appendChild(dictationButton);
    document.body.appendChild(llmToggleWrapper);
    console.log('Button and toggle appended to body successfully.');
} else {
    console.error('document.body is not available.');
}

let mediaRecorder;
let audioChunks = [];
let transcriptionText = '';
let gmailContext = {};

dictationButton.addEventListener('click', function () {
    if (dictationButton.textContent === 'Start Recording') {
        // If LLM toggle is checked and we are on Gmail, extract Gmail context
        if (isOnGmail && llmToggle.checked) {
            extractGmailContext();
        }
        startDictation();
    } else if (dictationButton.textContent === 'Stop Recording') {
        stopDictation();
    }
});

function extractGmailContext() {
    try {
        let senderElement = document.querySelector('span[id^=":"][dir="ltr"]');
        if (!senderElement) {
            senderElement = document.querySelector('.gb_yb.gbii'); // Gmail profile picture tooltip might have the name
        }

        if (senderElement) {
            // Extract the sender's name from the innerText, trimming any email address details
            gmailContext.senderName = senderElement.innerText.split('<')[0].trim();
        } else {
            gmailContext.senderName = "Unknown Sender";
        }

        // Extract recipient names from the "To" field in compose or reply box
        const recipientsElements = document.querySelectorAll('.akl'); // Gmail uses this class for recipients in compose
        gmailContext.recipientNames = [...recipientsElements].map(recipient => recipient.innerText.trim());

        const threadElements = [...document.querySelectorAll('.a3s.aXjCH')];
        gmailContext.emailThread = threadElements.map(thread => thread.innerText).join('\n');

        console.log('Gmail context extracted:', gmailContext);
    } catch (error) {
        console.error('Error extracting Gmail context:', error);
        gmailContext = {}; // Clear context in case of error
    }
}

async function startDictation() {
    console.log('Start dictation triggered');

    try {
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
                    body: formData,
                });

                const data = await response.json();

                if (llmToggle.checked) {
                    if (data.originalTranscription) {
                        transcriptionText = data.originalTranscription.trim();
                        console.log(`Original Transcription: ${transcriptionText}`);

                        await correctTranscription(transcriptionText);
                    } else {
                        console.error('Unexpected response format:', data);
                        resetButtonState();
                    }
                } else if (data.originalTranscription) {
                    transcriptionText = data.originalTranscription.trim();
                    console.log(`Original Transcription: ${transcriptionText}`);

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

        mediaRecorder.start();
        dictationButton.textContent = 'Stop Recording';
        dictationButton.style.backgroundColor = '#dc3545'; // Stop Recording - red
        console.log('Recording started...');
    } catch (error) {
        console.error('Error accessing microphone:', error);
        resetButtonState();
    }
}

function stopDictation() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log('Recording stopped...');
    }
}

async function correctTranscription(transcription) {
    dictationButton.textContent = 'Correcting';
    dictationButton.style.backgroundColor = '#ffc107'; // Correcting - yellow

    try {
        let contextPrompt = "";
        if (gmailContext.senderName) {
            contextPrompt += `The sender's name is ${gmailContext.senderName}. `;
        }
        if (gmailContext.recipientNames && gmailContext.recipientNames.length > 0) {
            contextPrompt += `The recipient(s) are: ${gmailContext.recipientNames.join(', ')}. `;
        }
        if (gmailContext.emailThread) {
            contextPrompt += `Here is the relevant email thread: ${gmailContext.emailThread}. `;
        }

        const prompt = `${contextPrompt}\n\nPlease correct the following transcription for proper noun recognition, grammar, and contextual accuracy. If provided, please use context to make adjustments to original transcription. Only correct the existing message and write nothing else. \n\nOriginal Transcription: \n\n${transcription} \n\nCorrected Transcription: \n\n`;

        const requestBody = {
            transcription: prompt,
        };

        const response = await fetch('http://localhost:5001/api/correct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (data.correctedTranscription) {
            transcriptionText = data.correctedTranscription.trim();
            console.log(`Enhanced Transcription: ${transcriptionText}`);

            await copyAndStoreTranscription(transcriptionText);

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

async function copyAndStoreTranscription(transcription) {
    try {
        window.focus();

        await navigator.clipboard.writeText(transcription);
        console.log('Transcription copied to clipboard. Ready to paste.');

        storeTranscription(transcription);
    } catch (error) {
        console.error('Failed to copy transcription to clipboard:', error);
    }
}

function resetButtonState() {
    dictationButton.textContent = 'Start Recording';
    dictationButton.style.backgroundColor = '#007bff'; // Start Recording - blue
}

function storeTranscription(transcription, retries = 3) {
    chrome.runtime.sendMessage({ type: 'STORE_TRANSCRIPTION', transcription }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending transcription to background script:', chrome.runtime.lastError.message);

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
