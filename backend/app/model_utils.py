import tensorflow as tf
import pickle

custom_objects = {"mse": tf.keras.losses.MeanSquaredError()}
model = tf.keras.models.load_model("sentiment_analysis_model.h5", custom_objects=custom_objects)
print("Model loaded successfully!")

with open("tokenizer.pickle", "rb") as handle:
    tokenizer = pickle.load(handle)

label_mapping = {
    0: "joy",
    1: "sad",
    2: "fear",
    3: "love",
    4: "suprise",  
    5: "anger"
}

print(f"Label Mapping: {label_mapping}")
