from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from cpp_stability.wrapper import calculate_emotion_stability

router = APIRouter()

class EmotionLog(BaseModel):
    emotions: List[str]

label_to_score = {
    "joy": 1,
    "love": 2,
    "surprise": 3,
    "neutral": 4,
    "sad": 5,
    "fear": 6,
    "anger": 7
}

def classify_burnout(score: float) -> str:
    if score > 75:
        return "High"
    elif score > 55:
        return "Moderate"
    else:
        return "Low"

@router.post("/stability-index")
async def get_stability_index(log: EmotionLog):
    try:
        normalized_emotions = [label.lower() for label in log.emotions]
        scores = [label_to_score[label] for label in normalized_emotions]
    except KeyError as e:
        return {"error": f"Unsupported emotion label: {str(e)}"}

    stability_index = calculate_emotion_stability(scores)
    burnout_risk = classify_burnout(stability_index)

    return {
        "stability_index": round(stability_index, 2),
        "burnout_risk": burnout_risk
    }
