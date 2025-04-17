from huggingface_hub import login
from dotenv import load_dotenv
import os
import sys
import json
from transformers import pipeline

# Load environment variables from .env file
load_dotenv()
token = os.getenv("HF_TOKEN")

# Get input text from command line, or use default
if len(sys.argv) > 1:
    text = sys.argv[1]
    # print("Text received from frontend:", text)
else:
    text = "Breaking: Scientists confirm the Moon is made of cheese."
    print("No input provided, using default text.")

# Load the fake news detection model
try:
    classifier = pipeline("text-classification", model="omykhailiv/bert-fake-news-recognition")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    sys.exit(1)

# Run classification
result = classifier(text)[0]
label = result['label']
confidence = float(result['score'])

# Convert label to something human-readable (optional)
if label == "LABEL_0":
    label = "Fake"
elif label == "LABEL_1":
    label = "Real"

# Output result as JSON
output = {
    "label": label,
    "confidence": confidence
}

print(json.dumps(output))
