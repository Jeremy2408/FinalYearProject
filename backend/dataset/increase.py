from textattack.augmentation import WordNetAugmenter
import pandas as pd

augmenter = WordNetAugmenter()
df = pd.read_csv("dataset/balanced_dataset.csv")

for label in ["suprise", "love", "fear"]:
    subset = df[df["emotion"] == label]
    needed_samples = 50_000 - len(subset)

    if needed_samples > 0:
        augmented_texts = []
        for i, text in enumerate(subset["sentence"][:needed_samples]):
            augmented_texts.append(augmenter.augment(text)[0])  

            if i % 1000 == 0:  # Print progress every 1000 sentences
                print(f" {i}/{needed_samples} samples generated for {label}")

        new_data = pd.DataFrame({"sentence": augmented_texts, "emotion": [label] * len(augmented_texts)})
        df = pd.concat([df, new_data], ignore_index=True)

df.to_csv("final_balanced_dataset.csv", index=False)
print(" Augmentation Done! Final dataset saved.")
