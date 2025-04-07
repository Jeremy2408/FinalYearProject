from fastapi import APIRouter
from firebase_admin import firestore
from datetime import datetime, timedelta
import uuid

router = APIRouter()
db = firestore.client()

@router.get("/send-deadline-reminders")
def send_deadline_reminders():
    now = datetime.utcnow()
    upcoming_window = now + timedelta(days=3)

    events_ref = db.collection_group("events")
    events = events_ref.where("linkedGroupChatId", "!=", None).stream()

    reminders_sent = 0

    for event in events:
        event_data = event.to_dict()
        event_id = event.id
        group_id = event_data.get("linkedGroupChatId")
        group_name = event_data.get("linkedGroupChatName")
        due_date = event_data.get("dueDate")
        chat_type = event_data.get("linkedGroupChatType", "group")

        if not group_id or not due_date:
            continue

        if isinstance(due_date, dict) and "_seconds" in due_date:
            due_datetime = datetime.utcfromtimestamp(due_date["_seconds"])
        elif hasattr(due_date, 'timestamp'):
            due_datetime = due_date
        else:
            continue

        if not now <= due_datetime <= upcoming_window:
            continue

        reminder_id = f"{event_id}_{group_id}"
        reminder_doc = db.collection("group_reminders").document(reminder_id)
        if reminder_doc.get().exists:
            continue  
        chatroom_collection = "module_chatrooms" if chat_type == "module" else "group_chatrooms"

        message_ref = db.collection(chatroom_collection).document(group_id).collection("messages")
        message_ref.add({
            "_id": str(uuid.uuid4()),
            "text": f" Reminder: \"{event_data.get('title', 'Unnamed Task')}\" is due on {due_datetime.strftime('%A, %b %d')}.",
            "createdAt": firestore.SERVER_TIMESTAMP,
            "system": True
        })

        reminder_doc.set({
            "sent": True,
            "sentAt": firestore.SERVER_TIMESTAMP
        })

        reminders_sent += 1

    return {"reminders_sent": reminders_sent}
