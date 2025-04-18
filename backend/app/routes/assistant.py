from fastapi import APIRouter
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
import uuid
from firebase_admin import firestore
from firebase_config import db

router = APIRouter()

load_dotenv()
openai.api_key = os.getenv("OPEN_AI_KEY")

class AssistantRequest(BaseModel):
    prompt: str
    roomId: str
    roomType: str  

@router.post("/smart-assistant")
async def smart_assistant(request: AssistantRequest):
    try:
        print(f" Incoming smart assistant request for {request.roomType}_chatrooms/{request.roomId}")

        system_prompt = (
            "You are a kind and emotionally supportive assistant for college students."
            " Respond briefly (1-3 sentences max) with empathy and useful advice."
            " Do not ask questions, just offer supportive, constructive replies."
        )

        trigger_phrases = [
            "/resources",
            "/wellness help",
            "where can i get support",
            "how do i get help",
        ]

        if any(phrase in request.prompt.lower() for phrase in trigger_phrases):
            reply = (
                " You can access TU Dublin's official student wellbeing services here:\n"
                "https://www.tudublin.ie/for-students/student-services-and-support/student-wellbeing/"
            )
        else:
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.prompt.strip()}
                ]
            )
            reply = response.choices[0].message.content.strip()

        print(" Assistant Reply:", reply)

        chatroom_collection = "module_chatrooms" if request.roomType == "module" else "group_chatrooms"
        message_ref = db.collection(chatroom_collection).document(request.roomId).collection("messages")
        message_ref.add({
            "_id": str(uuid.uuid4()),
            "text": reply,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "system": True,
            "user": {
                "_id": "support_bot",
                "name": "SupportBot",
                "avatar": "https://i.imgur.com/6VBx3io.png"  
            }
        })

        return {"success": True, "reply": reply}

    except Exception as e:
        print(" Assistant Error:", e)
        return {"success": False, "error": str(e)}
