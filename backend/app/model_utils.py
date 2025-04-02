import tensorflow as tf
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