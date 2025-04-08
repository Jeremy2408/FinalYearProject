from fastapi import APIRouter
from pydantic import BaseModel
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import openai
import os
from dotenv import load_dotenv
from app.model_utils import model, tokenizer, label_mapping
from firebase_admin import firestore
from firebase_config import db
import uuid

router = APIRouter()

load_dotenv()
openai.api_key = os.getenv("OPEN_AI_KEY")

class TextRequest(BaseModel):
    text: str
    linkedGroupChatId: str = None
    linkedGroupChatType: str = None

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

def predict_emotion(text):
    sequence = tokenizer.texts_to_sequences([text])
    padded_sequence = pad_sequences(sequence, maxlen=50, padding="post", truncating="post")
    label_pred = model.predict(padded_sequence)
    predicted_label_index = int(label_pred.argmax())
    predicted_label = label_mapping.get(predicted_label_index, "Unknown")
    return predicted_label

@router.post("/predict")
async def predict(request: TextRequest):
    text = request.text
    linked_group_id = request.linkedGroupChatId
    linked_group_type = request.linkedGroupChatType

    if is_neutral(text):
        emotion_label = "Neutral"
    else:
        raw_label = predict_emotion(text)
        emotion_label = raw_label.capitalize()
        if emotion_label == "Suprise":
            emotion_label = "Surprise"

    numeric_sentiment_score = get_openai_sentiment_score(text)

    trigger_emotions = ["Sad", "Fear", "Anger"]
    if linked_group_id and emotion_label in trigger_emotions:
        chatroom_collection = "module_chatrooms" if linked_group_type == "module" else "group_chatrooms"
        message_ref = db.collection(chatroom_collection).document(linked_group_id).collection("messages")

        system_message = {
            "_id": str(uuid.uuid4()),
            "text": "😓 Heads up: Someone in this group might be feeling overwhelmed. Be kind to each other.",
            "createdAt": firestore.SERVER_TIMESTAMP,
            "system": True
        }

        message_ref.add(system_message)
        print(f" Sent group wellness nudge to {chatroom_collection}/{linked_group_id}")

    return {
        "emotion": emotion_label,
        "numeric_sentiment_score": numeric_sentiment_score
    }
