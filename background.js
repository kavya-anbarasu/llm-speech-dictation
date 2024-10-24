chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STORE_TRANSCRIPTION') {
        const { transcription } = message;

        // Store transcription in chrome.storage
        chrome.storage.local.get({ transcriptionHistory: [] }, (result) => {
            const updatedHistory = result.transcriptionHistory;
            updatedHistory.push(transcription); // Add the new transcription
            chrome.storage.local.set({ transcriptionHistory: updatedHistory }, () => {
                console.log('Transcription saved to chrome storage.');
                sendResponse({ success: true });
            });
        });

        // Required to indicate an asynchronous response is expected
        return true;
    }
});
