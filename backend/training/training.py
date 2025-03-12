import tensorflow as tf
import numpy as np
import pandas as pd
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split
import pickle

df = pd.read_csv("dataset/final_balanced_dataset.csv")

print(" Dataset Label Distribution:\n", df["emotion"].value_counts())

texts = df["sentence"].tolist()
labels = df["emotion"].tolist()

label_mapping = {label: i for i, label in enumerate(df["emotion"].unique())}
y_labels = np.array([label_mapping[label] for label in labels])  

tokenizer = Tokenizer(num_words=10000, oov_token="<OOV>")
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)

max_length = 50  

X = pad_sequences(sequences, maxlen=max_length, padding="post", truncating="post")

X_train, X_test, y_train_labels, y_test_labels = train_test_split(
    X, y_labels, test_size=0.2, random_state=42
)

glove_path = "glove.6B.100d.txt"


embedding_index = {}
with open(glove_path, encoding="utf8") as f:
    for line in f:
        values = line.split()
        word = values[0]
        coef = np.asarray(values[1:], dtype="float32")
        embedding_index[word] = coef

vocab_size = 10000  
embedding_dim = 100  

embedding_matrix = np.zeros((vocab_size, embedding_dim))
for word, i in tokenizer.word_index.items():
    if i >= vocab_size:  
        continue
    embedding_vector = embedding_index.get(word)
    if embedding_vector is not None:
        embedding_matrix[i] = embedding_vector  

input_layer = tf.keras.layers.Input(shape=(max_length,))
embedding_layer = tf.keras.layers.Embedding(vocab_size, embedding_dim, weights=[embedding_matrix], trainable=False)(input_layer)

x = tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(64, return_sequences=True))(embedding_layer)
x = tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(32))(x)
x = tf.keras.layers.Dense(64, activation='relu')(x)
x = tf.keras.layers.Dropout(0.5)(x)  

label_output = tf.keras.layers.Dense(len(label_mapping), activation='softmax', name="emotion_label")(x)

# Define Model
model = tf.keras.Model(inputs=input_layer, outputs=label_output)

model.compile(
    loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=False, reduction="sum_over_batch_size"),  
    optimizer="adam",
    metrics=["accuracy"]
)

# Train Model 
history = model.fit(
    X_train, y_train_labels,
    epochs=15,  
    batch_size=64,
    validation_data=(X_test, y_test_labels)
)

with open("tokenizer.pickle", "wb") as handle:
    pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)
print(" Tokenizer saved successfully!")

model.save("sentiment_analysis_model.h5")
print(" Model training complete! Saved as 'sentiment_analysis_model.h5'.")
