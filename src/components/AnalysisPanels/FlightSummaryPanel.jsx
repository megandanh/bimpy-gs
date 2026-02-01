import "./infoPanels.css";

function StatusRow({ label, value }) {
  return (
    <div className="flight-display">
        <div className="flight-labels">{label}</div>
        <div className="flight-vals">{value}</div>
    </div>
  );
}

function fmtDuration(ms) {
    if (ms == null) return "—";
    const sec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
}

function avg(nums) {
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function FlightSummaryPanel({ flight, logs, loading }) {
    if (loading) {
        return (
        <div className="panel">
            <h2 className="panel-title">SUMMARY</h2>
            <StatusRow label="Total Time:" value="Loading…" />
            <StatusRow label="Average Altitude:" value="—" />
            <StatusRow label="Samples:" value="—" />
        </div>
        );
  }

    if (!flight) {
        return (
            <div className="panel">
                <h2 className="panel-title">SUMMARY</h2>
                <StatusRow label="Status:" value="No flight selected" />
            </div>
        );
    }

    const start = flight.start_time ?? (logs?.[0]?.t_ms ?? null);
    const end =
        flight.end_time ??
        (logs && logs.length ? logs[logs.length - 1].t_ms : null);

    const totalMs = start && end ? end - start : null;

    const altitudes = (logs || [])
        .map((l) => l.altitude)
        .filter((x) => typeof x === "number");

    const avgAlt = avg(altitudes);
    const samples = flight.samples ?? logs?.length ?? 0;

    return (
        <div className="panel">
            <h2 className="panel-title">SUMMARY</h2>
            <StatusRow label="Total Time:" value={fmtDuration(totalMs)} />
            <StatusRow
                label="Average Altitude:"
                value={avgAlt == null ? "—" : avgAlt.toFixed(2)}
            />
            <StatusRow label="Samples:" value={samples} />
        </div>
    );
}
