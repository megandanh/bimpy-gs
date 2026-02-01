import "./infoPanels.css";

function fmtTime(r) {
  if (r.timestamp) return r.timestamp;          // console mode
  if (r.t_ms) return new Date(r.t_ms).toLocaleTimeString(); // analysis mode
  return "—";
}

export default function LogPanel({ rows = [] }) {
  return (
    <div className="panel log-panel">
      <h2 className="panel-title">LOG</h2>

        <div className="log-table-wrap">
            <table className="log-table">
                <thead>
                    <tr>
                    <th>Local Time</th>
                    <th>Altitude</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Speed</th>
                    <th>Pressure</th>
                    <th>Battery</th>
                    <th>Distance</th>
                    <th>Displacement</th>
                    </tr>
                </thead>

                <tbody>
                    {[...rows].map((r, idx) => (
                    <tr key={`${r.t_ms ?? r.timestamp ?? "row"}-${idx}`}>
                        <td>{fmtTime(r)}</td>
                        <td>{r.altitude ?? "—"}</td>
                        <td>{r.latitude ?? "—"}</td>
                        <td>{r.longitude ?? "—"}</td>
                        <td>{r.speed ?? "—"}</td>
                        <td>{r.pressure ?? "—"}</td>
                        <td>{r.battery ?? "—"}</td>
                        <td>{r.distance ?? "—"}</td>
                        <td>{r.displacement ?? "—"}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
