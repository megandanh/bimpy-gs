import "./log.css";

export default function LogPanel({ rows }) {
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
                    </tr>
                </thead>

                <tbody>
                    {[...rows].reverse().map((r, idx) => (
                    <tr key={`${r.timestamp}-${idx}`}>
                        <td>{r.timestamp}</td>
                        <td>{r.altitude}</td>
                        <td>{r.latitude}</td>
                        <td>{r.longitude}</td>
                        <td>{r.speed}</td>
                        <td>{r.pressure}</td>
                        <td>{r.battery}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    );
}