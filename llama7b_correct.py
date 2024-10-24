# llama7b_correct.py
import sys
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import os
from dotenv import load_dotenv

MODEL_NAME = "meta-llama/Llama-2-7b-chat-hf"
LOCAL_MODEL_PATH = "./local_llama_model"

load_dotenv()
access_token = os.getenv('HF_AUTH_TOKEN')


def load_model():
    # print("Loading Llama 2 7B model...")
    tokenizer = AutoTokenizer.from_pretrained(
        LOCAL_MODEL_PATH, token=access_token,
        legacy=True, local_files_only=True
    )
    # tokenizer.save_pretrained(LOCAL_MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(
        LOCAL_MODEL_PATH, token=access_token, torch_dtype=torch.float16,
        local_files_only=True
    )
    # model.save_pretrained(LOCAL_MODEL_PATH)
    model.to("cuda" if torch.cuda.is_available() else "cpu")
    return model, tokenizer


def generate_corrections(model, tokenizer, transcription):
    # print(f"INPUT TRANSCRIPTION: {transcription}")
    input_ids = tokenizer(
        transcription, return_tensors="pt").input_ids.to(model.device)

    # Generate response with the Llama 2 model
    with torch.no_grad():
        output = model.generate(
            input_ids, max_length=500,
            do_sample=True, top_p=0.95, temperature=0.7)

    corrected_text = tokenizer.decode(output[0], skip_special_tokens=True)
    # print(f"RAW LLM OUTPUT: {corrected_text}")

    corrected_text = corrected_text.split("Corrected Transcription:")[1].strip()  # noqa: E501
    # print(f"CLEANED LLM OUTPUT: {corrected_text}")

    return corrected_text


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python llama7b_correct.py <transcription_file_path>")
        sys.exit(1)

    transcription_file_path = sys.argv[1]

    try:
        with open(transcription_file_path, 'r') as f:
            transcription = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {transcription_file_path}")
        sys.exit(1)

    model, tokenizer = load_model()

    corrected_text = generate_corrections(model, tokenizer, transcription)

    print(corrected_text)
