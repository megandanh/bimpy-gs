import "./infoPanels.css";

function StatusRow({ label, value }) {
  return (
    <div className="flight-display">
        <div className="flight-labels">{label}</div>
        <div className="flight-vals">{value}</div>
    </div>
  );
}

function fmtDate(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString();
}

function fmtTime(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleTimeString();
}

export default function FlightPanel({ flight, loading }) {
  return (
    <div className="panel">
      <h2 className="panel-title">FLIGHT</h2>

      {loading ? (
        <>
            <StatusRow label="ID:" value="Loading…" />
            <StatusRow label="Date:" value="—" />
            <StatusRow label="Start Time:" value="—" />
            <StatusRow label="End Time:" value="—" />
        </>
      ) : !flight ? (
        <StatusRow label="Status:" value="No flight selected" />
      ) : (
        <>
            <StatusRow label="ID:" value={flight.id ?? "—"} />
            <StatusRow label="Date:" value={fmtDate(flight.start_time)} />
            <StatusRow label="Start Time:" value={fmtTime(flight.start_time)} />
            <StatusRow label="End Time:" value={flight.end_time ? fmtTime(flight.end_time) : "—"} />
        </>
      )}
    </div>
  );
}
