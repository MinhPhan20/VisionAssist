import React, { useState, useEffect } from 'react';
import './App.css';

// npm run dev

function App() {
  const [detections, setDetections] = useState([]);
  const [systemStatus, setSystemStatus] = useState('Connected');
  // Check if any of the detected items are known obstacles
  // Only trigger the alarm if it's a hazard AND it is "Close"
    const hazardItems = ['Chair', 'Table'];
//   Can add 'Person' after
    const hasHazard = detections.some(data =>
      hazardItems.includes(data.item) && data.proximity === 'Close'
    );

  // NEW: This hook runs automatically and pings Python for data every 500ms
  useEffect(() => {
    const fetchDetections = async () => {
      try {
        const response = await fetch('http://localhost:8000/detections');
        if (response.ok) {
          const data = await response.json();
          setDetections(data);
          setSystemStatus('Connected');
        } else {
          setSystemStatus('Backend Offline');
        }
      } catch (error) {
        setSystemStatus('Disconnected');
      }
    };

    // Set up a timer to fetch data every 500 milliseconds (half a second)
    const intervalId = setInterval(fetchDetections, 500);

    // Cleanup the timer if we close the component
    return () => clearInterval(intervalId);
  }, []);
    // ... KEEP THE REST OF YOUR RETURN STATEMENT EXACTLY THE SAME ...
  return (
    <div className="dashboard-root">

      {/* Header */}
      <header className="dashboard-header">
        <h1 className="header-title">👁️ VisionAssist Dashboard</h1>
        <p className="system-status">
          System Status:{' '}
          <span style={{ color: systemStatus === 'Connected' ? '#4FAF7A' : '#ff4a4a' }}>
            ● {systemStatus}
          </span>
        </p>
      </header>

      {/* Main Content Layout */}
      <div className="dashboard-grid">

        {/* Left Side: Live Camera Stream */}
        <div className="panel">
          <h3 className="panel-title">📹 Live AI Telemetry Feed</h3>
          <div className="video-container">
            <img
              src="http://localhost:8000/video_feed"
              alt="Live AI Video Stream"
              className="live-stream-img"
              onError={() => setSystemStatus('Backend Offline')}
            />
          </div>
        </div>

        {/* Right Side: Object Logs & Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

          {/* Spatial Log */}
          <div className="panel" style={{ flex: 1 }}>
            <h3 className="panel-title">📋 Proximity Object Log</h3>
            <div className="log-container">
              {detections.map((data) => (
                <div key={data.id} className="log-item">
                  <div>
                    <span className="item-name">{data.item}</span>
                    <span className="item-confidence">Confidence: {data.confidence}</span>
                  </div>
                  <span className="item-status-badge">
                                      {data.proximity}
                                    </span>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Hazards */}
          {/* Environmental Hazards */}
            <div className="panel" style={{ border: hasHazard ? '2px solid #ff4a4a' : '1px solid #333' }}>
                <h3 className="alert-title" style={{ color: hasHazard ? '#ff4a4a' : '#ffcc00' }}>
                    {hasHazard ? '🛑 COLLISION WARNING' : '⚠️ Navigation Alerts'}
                </h3>
                <p className="alert-text" style={{ color: hasHazard ? '#ffb3b3' : '#bbb' }}>
                    {hasHazard ? 'Obstacle detected in immediate pathway. Please proceed with caution.'
                          : 'No immediate collision hazards detected in current pathway.'}
                </p>
            </div>

        </div>

      </div>
    </div>
  );
}

export default App;