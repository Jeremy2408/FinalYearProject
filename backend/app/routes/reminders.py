from fastapi import APIRouter
from firebase_config import db
from datetime import datetime, timedelta
import uuid

router = APIRouter()

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

        if not due_date and "start" in event_data and "dateTime" in event_data["start"]:
            try:
                due_date_str = event_data["start"]["dateTime"]
                due_datetime = datetime.fromisoformat(due_date_str.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception as e:
                print(f" Invalid start.dateTime format: {e}")
                continue
        elif isinstance(due_date, dict) and "_seconds" in due_date:
            due_datetime = datetime.utcfromtimestamp(due_date["_seconds"])
        elif hasattr(due_date, 'timestamp'):
            due_datetime = due_date.replace(tzinfo=None)
        else:
            print(" No valid due date found, skipping")
            continue

        if not now <= due_datetime <= upcoming_window:
            print(f"⏩ Skipping event due {due_datetime}, outside reminder window")
            continue

        chat_type = event_data.get("linkedGroupChatType")

        group_chat_doc = db.collection("group_chatrooms").document(group_id).get()
        module_chat_doc = db.collection("module_chatrooms").document(group_id).get()

        if chat_type not in ["group", "module"]:
            if group_chat_doc.exists:
                chat_type = "group"
            elif module_chat_doc.exists:
                chat_type = "module"
            else:
                print(f" No valid chatroom found for {group_id}, skipping")
                continue

        chatroom_collection = "module_chatrooms" if chat_type == "module" else "group_chatrooms"

        reminder_id = f"{event_id}_{group_id}"
        reminder_doc = db.collection("group_reminders").document(reminder_id)
        if reminder_doc.get().exists:
            print(f" Reminder already sent for {reminder_id}, skipping")
            continue

        print(f" Sending reminder for '{event_data.get('title', 'Unnamed Task')}' to {chatroom_collection}/{group_id}")

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

    print(f"✅Total reminders sent: {reminders_sent}")
    return {"reminders_sent": reminders_sent}
