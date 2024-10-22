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
    console.log('Start dictation triggered');
    alert('Dictation started!');
});

// Set up a MutationObserver to monitor changes to the body element
const observer = new MutationObserver(() => {
    // Check if the button is still in the document
    if (!document.contains(dictationButton)) {
        document.body.appendChild(dictationButton);
        console.log('Dictation button re-added to the page.');
    }
});

// Start observing the document body for child element changes
observer.observe(document.body, { childList: true, subtree: true });
