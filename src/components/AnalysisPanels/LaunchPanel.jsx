import "./infoPanels.css";

function StatusRow({ label, value }) {
  return (
    <div className="flight-display">
        <div className="flight-labels">{label}</div>
        <div className="flight-vals">{value}</div>
    </div>
  );
}

function fmtLocalTimeFromMs(ms) {
    if (!ms) return "—";
    const d = new Date(ms);
    return d.toLocaleTimeString();
}

export default function LaunchPanel({ logs, loading }) {
    const first = logs && logs.length ? logs[logs.length - 1] : null;

  return (
    <div className="panel">
        <h2 className="panel-title">LAUNCH</h2>

        {loading ? (
            <>
            <StatusRow label="Time:" value="Loading…" />
            <StatusRow label="Latitude:" value="—" />
            <StatusRow label="Longitude:" value="—" />
            </>
        ) : !first ? (
            <StatusRow label="Status:" value="No telemetry available" />
        ) : (
            <>
            <StatusRow label="Time:" value={fmtLocalTimeFromMs(first.t_ms)} />
            <StatusRow label="Latitude:" value={first.latitude ?? "—"} />
            <StatusRow label="Longitude:" value={first.longitude ?? "—"} />
            </>
        )}
    </div>
  );
}
