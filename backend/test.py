import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import pickle
import pandas as pd
import openai
from dotenv import load_dotenv
import os
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


load_dotenv()

openai.api_key =  os.getenv("OPEN_AI_KEY")  

def is_neutral(text):
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an emotion detector. Only reply with 'Neutral' or 'Emotional'."},
            {"role": "user", "content": f"Is this sentence emotionally neutral?\n\n\"{text}\""}
        ]
    )
    reply = response.choices[0].message.content.strip().lower()

    return "neutral" in reply
custom_objects = {"mse": tf.keras.losses.MeanSquaredError()}

model = tf.keras.models.load_model("sentiment_analysis_model.h5", custom_objects=custom_objects)

print(" Model loaded successfully!")

with open("tokenizer.pickle", "rb") as handle:
    tokenizer = pickle.load(handle)

df = pd.read_csv("dataset/final_balanced_dataset.csv")  
unique_labels = df["emotion"].unique()  
label_mapping = {i: label for i, label in enumerate(unique_labels)}

print(f"Label Mapping in Test Script: {label_mapping}")

# Function to make a prediction
def predict_emotion(text):
    sequence = tokenizer.texts_to_sequences([text])
    print(f" Tokenized Input for '{text}': {sequence}")  # Debugging

    padded_sequence = pad_sequences(sequence, maxlen=50, padding="post", truncating="post")
    
    label_pred = model.predict(padded_sequence)

    print(f"\n Raw Model Probabilities for: {text}")
    for i, prob in enumerate(label_pred[0]):
        print(f"{label_mapping[i]}: {prob:.3f}") 
    predicted_label_index = int(label_pred.argmax())  
    predicted_label = label_mapping.get(predicted_label_index, "Unknown")

    print(f" Predicted Emotion: {predicted_label}\n")
    return predicted_label

test_inputs = [
    "I'm so scared !",
    "I feel  great today.",
    "I had a bad day.",
    "I feel terrible",
    "Best day ever!",
    "I'm so pissed off",
    "I'm so happy",
    "I'm so shocked about the news",
    "I failed my exams and i am so sad", 
    "I've passed my exams",
    "I'm fine",
    "I had an ok day",
]

for text in test_inputs:
    if is_neutral(text):
        predicted_emotion = "neutral"
    else:
        predicted_emotion = predict_emotion(text)

    print(f"Input: {text}")
    print(f"Predicted Emotion: {predicted_emotion}\n")

def get_openai_sentiment_score(text):
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": (
                "You analyze sentences and assign sentiment scores."
                "Provide only a numerical sentiment score from -1.0 (extremely negative) "
                "to 0.0 (neutral) to 1.0 (extremely positive), with two decimal points."
                "No explanations, only the number."
            )},
            {"role": "user", "content": f"Analyze sentiment numerically:\n\n\"{text}\""}
        ]
    )
    reply = response.choices[0].message.content.strip()

    try:
        score = float(reply)
    except ValueError:
        score = 0.0

    return score

class TextRequest(BaseModel):
    text: str

@app.post("/predict")
async def predict(request: TextRequest):
    text = request.text

    if is_neutral(text):
        emotion_label = "neutral"
    else:
        emotion_label = predict_emotion(text)

    numeric_sentiment_score = get_openai_sentiment_score(text)

    return {
        "emotion": emotion_label,
        "numeric_sentiment_score": numeric_sentiment_score
    }

