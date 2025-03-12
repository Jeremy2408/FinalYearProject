import pandas as pd

df = pd.read_csv("dataset/combined_emotion.csv")

# Undersample Joy and Sadness to 50,000 each
df_joy = df[df["emotion"] == "joy"].sample(n=50_000, random_state=42)
df_sad = df[df["emotion"] == "sad"].sample(n=50_000, random_state=42)

# Keep all other emotions
df_other = df[df["emotion"].isin(["anger", "fear", "love", "suprise"])]

df_balanced = pd.concat([df_joy, df_sad, df_other], ignore_index=True)

df_balanced.to_csv("balanced_dataset.csv", index=False)
print(" Balanced dataset saved!")
