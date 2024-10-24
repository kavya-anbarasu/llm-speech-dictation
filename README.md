# Wispr Interview Dictation Tool (specialized for Gmail!)

## Overview

Gmail Dictation Tool is a Chrome extension that allows users to dictate email messages directly within Gmail. It provides an easy-to-use button to start and stop recording, transcribes spoken words into text using Whisper AI, and offers an option to improve the transcription using an LLM (Llama-2 7B) for better accuracy in names, grammar, and contextual content.

## Features

- **Start/Stop Dictation Button:** Easily record voice and get a transcription of your speech.
- **LLM Correction Toggle:** Option to enhance transcription accuracy using Llama-2 7B.
- **Automatic Clipboard Copying:** The transcription is automatically copied to your clipboard for easy pasting.
- **Gmail Context Extraction:** Automatically extracts context (sender, recipient names, email thread) from Gmail to improve transcription accuracy.

## Prerequisites

- **Google Chrome** browser.
- **Node.js** and **npm** installed on your local system.
- **Python** with required libraries (e.g., `transformers`, `torch`).
- **Whisper** installed for speech-to-text transcription.
- **Llama-7b-chat-hf** from hugging face downloaded locally.

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/wispr-interview.git
   cd wispr-interview
   ```

2. **Install Backend Dependencies**

   Navigate to the backend server directory and install the required dependencies:

   ```bash
   cd server
   npm install
   ```

3. **Install Python Dependencies**

   Install the required Python libraries:

   ```bash
   pip install transformers torch
   ```

4. **Load Chrome Extension**

   - Open Google Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode**.
   - Click on **Load unpacked** and select the cloned directory.

## Usage

1. **Open Gmail** in your browser.
2. **Click the "Start Recording" button** at the bottom left to begin dictation.
3. **Check the "Use LLM Correction" toggle** if you want enhanced transcription with contextual accuracy.
4. **Stop Recording** when you're done, and the transcription will be automatically copied to your clipboard.

## Project Structure

- **contentScript.js**: Handles the frontend interaction, including recording and extracting Gmail context.
- **background.js**: Manages storage and message passing.
- **server.js**: Node.js server that processes audio, uses Whisper for transcription, and Llama-2 for LLM correction.
- **llama7b_correct.py**: Python script for improving transcriptions using Llama-2.

## Gmail Context Extraction

When using LLM correction, the tool extracts key context such as the sender's name, recipient names, and email thread content to improve the transcription. This helps provide more accurate names and personalized grammar.

## API Endpoints

- **/api/transcribe**: Receives audio input and returns a transcription using Whisper.
- **/api/correct**: Receives the original transcription and Gmail context, and returns an improved transcription using Llama-2.

## Future Improvements

- **Better Context Handling**: Further refine the Gmail context extraction to support more dynamic email layouts.
- **Real-Time Transcription**: Add support for real-time transcription as you speak. Do more chunking of audio to stream. Then can do heuristic evaluations on if we want to use LLM for a given chunk which is faster than processing the whole thing.
- **Quantize Models**: both Whisper and Llama 7b are quite slow right now. Could do a lot to quantize (I'm thinking AWQ) and parallelize them.
- **Enhanced UI**: Improve the extension's UI for a more seamless integration with Gmail.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

