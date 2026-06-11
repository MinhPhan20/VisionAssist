# 👁️ VisionAssist: Real-Time AI Telemetry Dashboard
**[🔴 View Live Front-End Demo Here](visionassistants.netlify.app)**

VisionAssist is a full-stack application that leverages Machine Learning for real-time computer vision. It streams a live webcam feed through a custom Python/FastAPI backend, runs object detection using YOLOv8, and feeds telemetry data to a React-based spatial awareness dashboard.

## 🚀 Core Features
* **Real-Time Object Detection:** Utilizes the YOLOv8s model to identify household items and people with sub-second latency.
* **Depth Perception (Z-Axis Approximation):** Calculates bounding-box screen percentage to determine object proximity ("Close" vs "Far").
* **Dynamic Hazard Warnings:** Cross-references detected objects with a whitelist of known hazards to trigger collision alerts on the front-end dashboard.
* **Live Stream API:** Encodes OpenCV video frames into a byte stream, serving them directly to the React front-end via FastAPI.

## 🛠️ Tech Stack
**Frontend:** React, Vite, standard CSS
**Backend:** Python, FastAPI, Uvicorn
**Machine Learning & Vision:** Ultralytics YOLOv8 (Small), OpenCV

## ⚙️ Local Setup Instructions

### 1. Start the Frontend
cd frontend
npm install
npm run dev

### 2. Start the Backend
Navigate to the `backend` directory, activate the virtual environment, and start the FastAPI server:
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload

