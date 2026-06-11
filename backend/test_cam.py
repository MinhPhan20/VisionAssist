import cv2
from ultralytics import YOLO

# 1. Load a lightweight, pre-trained YOLOv8 model (detects 80 everyday objects)
print("Loading AI Model...")
model = YOLO("yolov8n.pt")  # 'n' stands for nano, the fastest/lightest version

# 2. Open a connection to your webcam (0 is usually the default built-in camera)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

print("Webcam started! Press 'q' on your keyboard to quit.")

while True:
    # Capture frame-by-frame
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame.")
        break

    # Run YOLOv8 object detection on the current camera frame
    results = model(frame, stream=True)

    # Draw the bounding boxes and labels onto the live video frame
    for r in results:
        annotated_frame = r.plot()

    # Display the resulting frame in a window named 'VisionAssist Test'
    cv2.imshow("VisionAssist Test", annotated_frame)

    # Break the loop immediately if the 'q' key is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Clean up and close windows when done
cap.release()
cv2.destroyAllWindows()
print("Webcam closed cleanly.")

# venv\Scripts\activate
# uvicorn main:app --reload
