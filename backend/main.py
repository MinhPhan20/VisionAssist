import asyncio
import torch
import gc
import json
import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

# Force PyTorch to use minimal memory on the free cloud tier
torch.set_num_threads(1)

app = FastAPI()

# Enable CORS so your Netlify app can securely talk to your local backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your exact Netlify URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the highly accurate small model
model = YOLO("yolov8s.pt")
@app.get("/")
async def health_check():
    return {"status": "Render is happy, server is alive!"}

@app.websocket("/ws/vision")
async def vision_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🚀 Netlify Frontend connected to AI WebSocket Pipeline!")

    allowed_items = ["cell phone", "cup", "bottle", "laptop", "chair", "person"]

    try:
        while True:
            # Receive raw frame bytes from the browser webcam
            bytes_data = await websocket.receive_bytes()

            # Convert raw bytes back into an OpenCV image frame matrix
            np_array = np.frombuffer(bytes_data, dtype=np.uint8)
            frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

            if frame is None:
                continue

            # Run YOLOv8 on the received frame
            results = model(frame, verbose=False)
            frame_detections = []

            for r in results:
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    ai_guess = model.names[class_id].lower()

                    # Calculate depth/proximity using bounding box screen area percentage
                    x, y, w, h = box.xywhn[0].tolist()
                    screen_area_used = w * h
                    proximity = "Close" if screen_area_used > 0.05 else "Far"

                    # Tune thresholds to filter out hallucinations
                    # TUNING: Drop standards for the Nano model so it stops ignoring everything
                    required_confidence = 0.40 if ai_guess == "cell phone" else 0.15

                    if confidence > required_confidence and ai_guess in allowed_items:
                        if ai_guess == "cup" or ai_guess == "bottle":
                            display_name = "Bottle / Cup"
                        else:
                            display_name = ai_guess.title()

                        frame_detections.append({
                            "item": display_name,
                            "confidence": f"{int(confidence * 100)}%",
                            "proximity": proximity
                        })
            # Print to the Render terminal so we can see what the AI is finding
            print(f"🔍 Processed frame: Found {len(frame_detections)} valid items.")
            # Send the clean AI telemetry JSON packet back up to the browser immediately
            await websocket.send_text(json.dumps({
                "status": "Online",
                "detections": frame_detections
            }))
            # THE FIX: Manually delete heavy variables and empty the RAM trash can
            del frame
            del results
            gc.collect()

    except WebSocketDisconnect:
        print("🛑 Frontend disconnected from AI Pipeline.")
    except Exception as e:
        print(f"⚠️ Error encountered in pipeline: {e}")