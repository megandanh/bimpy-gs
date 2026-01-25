import "./flightConfirm.css";

export default function StartFlightModal({
  isOpen,
  recordOn,
  setRecordingOn,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Would you like to record this flight?</h2>

        <div className="record-row">
          <div className="record-labels">
            <div className="record-label">Recording: </div>
            <div className="record-status">{recordOn ? "ON" : "OFF"}</div>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={recordOn}
              onChange={(e) => setRecordingOn(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}> Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Start Flight</button>
        </div>
      </div>
    </div>
  );
}
