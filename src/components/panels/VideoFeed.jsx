import { useState, useRef, useCallback } from "react";
import Webcam from "https://esm.sh/react-webcam@7.2.0";

const videoConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: "environment",
};

export default function MapPanel() {
  const webcamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [mirrored, setMirrored] = useState(false);

  const handleUserMedia = useCallback(() => {
    setReady(true);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((err) => {
    setError(err?.message || "Camera access denied or unavailable.");
    setReady(false);
  }, []);

  return (
    <div className="panel">
      <h2 className="panel-title">CAMERA FEED</h2>
      <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            // minHeight: "50vh",
            background: "#0a0a0a",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
          }}>

            {/* Video feed */}
            <div style={{
              width: "100%",
              maxWidth: 900,
              aspectRatio: "16/9",
              background: "#111",
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #1f2937",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                videoConstraints={videoConstraints}
                mirrored={mirrored}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {!ready && !error && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: 12,
                  background: "#0a0a0a",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: "2px solid #1f2937",
                    borderTopColor: "#60a5fa",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <span style={{ color: "#4b5563", fontSize: 13 }}>Requesting camera access…</span>
                </div>
              )}

              {error && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: 8,
                  background: "#0a0a0a",
                }}>
                  <span style={{ color: "#ef4444", fontSize: 14 }}>Camera unavailable</span>
                  <span style={{ color: "#4b5563", fontSize: 12, maxWidth: 280, textAlign: "center" }}>{error}</span>
                </div>
              )}

              {/* Corner overlay marks */}
              {ready && <>
                {[
                  { top: 8, left: 8, borderTop: "1px solid #60a5fa44", borderLeft: "1px solid #60a5fa44" },
                  { top: 8, right: 8, borderTop: "1px solid #60a5fa44", borderRight: "1px solid #60a5fa44" },
                  { bottom: 8, left: 8, borderBottom: "1px solid #60a5fa44", borderLeft: "1px solid #60a5fa44" },
                  { bottom: 8, right: 8, borderBottom: "1px solid #60a5fa44", borderRight: "1px solid #60a5fa44" },
                ].map((s, i) => (
                  <div key={i} style={{
                    position: "absolute", width: 18, height: 18, ...s,
                  }} />
                ))}
              </>}
            </div>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>


          </div>
  );
}
