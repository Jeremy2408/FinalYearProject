import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import pickle
import pandas as pd

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
]

for text in test_inputs:
    emotion = predict_emotion(text)
    print(f"Input: {text}")
    print(f"Predicted Emotion: {emotion}\n")
