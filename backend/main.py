import cv2
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()
# Change the 'n' to an 's'
model = YOLO("yolov8s.pt")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NEW: A global variable to store the objects currently on screen
current_detections = []

def generate_frames():
    global current_detections
    cap = cv2.VideoCapture(0)

    while True:
        success, frame = cap.read()
        if not success:
            break

        results = model(frame, stream=True)

        # Reset the list for this exact frame
        frame_detections = []

        for r in results:
            frame = r.plot()

            # We use lowercase to ensure perfect matching
        allowed_items = ["cell phone", "cup", "bottle", "laptop", "chair", "person"]

        for box in r.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            ai_guess = model.names[class_id].lower()

            x, y, w, h = box.xywhn[0].tolist()
            screen_area_used = w * h

            # TUNING 1: Lower the area to 5% (0.05).
            # If an object takes up 5% of the total screen pixels, it is within walking distance.
            proximity = "Close" if screen_area_used > 0.05 else "Far"

            # TUNING 2: Lower the required confidence so the log comes back!
            # Keep phones strict (80%) to stop hallucinations, but drop everything else to 50%
            required_confidence = 0.80 if ai_guess == "cell phone" else 0.50

            if confidence > required_confidence and ai_guess in allowed_items:

                if ai_guess == "cup" or ai_guess == "bottle":
                    display_name = "Bottle / Cup"
                else:
                    display_name = ai_guess.title()

                frame_detections.append({
                    "id": len(frame_detections),
                    "item": display_name,
                    "confidence": f"{int(confidence * 100)}%",
                    "proximity": proximity,
                    "status": "Tracking"
                })

        # Update the global list so our endpoint can read it
        current_detections = frame_detections

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/")
def health_check():
    return {"status": "VisionAssist Backend is Online!"}

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

# NEW: An endpoint that just returns the text data of what is on screen
@app.get("/detections")
def get_detections():
    return current_detections