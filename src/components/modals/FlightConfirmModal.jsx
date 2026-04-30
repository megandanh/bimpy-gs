import "./flightConfirm.css";

export default function StartFlightModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Start a new flight?</h2>
        <p style={{ opacity: 0.7, marginTop: 8 }}>Flight data will be recorded automatically.</p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Start Flight</button>
        </div>
      </div>
    </div>
  );
}