import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// npm run dev

function App() {
  const [detections, setDetections] = useState([]);
  const [status, setStatus] = useState('Connecting...');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
      // ⬇️ UNCOMMENT THIS LINE for local testing
//     const wsUrl = 'ws://localhost:8000/ws/vision';
    // Connect to your local FastAPI WebSocket server
    // When deployed, this can point to a public server address
    const wsUrl = ' wss://visionassist-ai.onrender.com/ws/vision';
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setStatus('Online & Connected to AI Engine');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📡 Raw AI Packet:", data);
      if (data.detections) {
        setDetections(data.detections);
      }
    };

    wsRef.current.onclose = () => {
      setStatus('Backend Offline');
    };

    wsRef.current.onerror = () => {
      setStatus('Connection Error');
    };

    // Start user's browser webcam stream
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      })
      .catch((err) => {
        console.error("Camera access denied: ", err);
        setStatus('Camera Access Denied');
      });

    // Frame capture interval loop (Sends 7 frames per second to avoid crashing free networks)
    const captureInterval = setInterval(() => {
      if (
        videoRef.current &&
        canvasRef.current &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Match canvas dimensions to video feed
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Draw current video frame onto hidden canvas memory space
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas drawing to raw binary JPEG blob array and send over socket
        canvas.toBlob((blob) => {
          if (blob && wsRef.current.readyState === WebSocket.OPEN) {
            blob.arrayBuffer().then((buffer) => {
              wsRef.current.send(buffer);
            });
          }
        }, 'image/jpeg', 0.9);
      }
    }, 1000); // Change this from 140 to 1000 to save the cloud CPU

    // Clean up connections on window close
    return () => {
      clearInterval(captureInterval);
      if (wsRef.current) wsRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Compute collision hazard alerts instantly on incoming telemetry array
  const hazardItems = ['Chair', 'Table'];
  const hasHazard = detections.some(data => hazardItems.includes(data.item) && data.proximity === 'Close');

  return (
    <div className="dashboard-container">
      {/* Top Banner Header */}
      <header className="dashboard-header">
        <h1>VisionAssist</h1>
        <div className={`status-badge ${status.includes('Online') ? 'status-online' : 'status-offline'}`}>
          {status}
        </div>
      </header>

      {/* Main Split Interface Area */}
      <div className="main-content">

        {/* Left Side: Browser Video Element */}
        <div className="video-panel">
          <h3>📹 Live Spatial Input</h3>
          <div className="video-wrapper">
            <video ref={videoRef} autoPlay playsInline muted className="webcam-feed" />
            {/* Hidden scratchpad canvas memory tool utilized for extraction */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Right Side: Tracking Logs */}
        <div className="telemetry-panel">
          <h3>📋 Object Telemetry Matrix</h3>
          <div className="log-list">
            {detections.length === 0 ? (
              <p className="no-data">Scanning field of view...</p>
            ) : (
              detections.map((data, index) => (
                <div key={index} className="log-item">
                  <span className="item-name">{data.item}</span>
                  <span className="item-conf">🎯 {data.confidence}</span>
                  <span className={`proximity-tag ${data.proximity === 'Close' ? 'prox-close' : 'prox-far'}`}>
                    {data.proximity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Area: Navigation Control Warnings */}
      <footer className="alert-footer" style={{ border: hasHazard ? '2px solid #ff4a4a' : '1px solid #333' }}>
        <h3 style={{ color: hasHazard ? '#ff4a4a' : '#ffcc00' }}>
          {hasHazard ? '🛑 COLLISION WARNING' : '⚠️ Navigation Alerts'}
        </h3>
        <p style={{ color: hasHazard ? '#ffb3b3' : '#bbb' }}>
          {hasHazard
            ? 'Obstacle detected in immediate pathway. Please proceed with caution.'
            : 'No immediate collision hazards detected in current pathway.'}
        </p>
      </footer>
    </div>
  );
}

export default App;