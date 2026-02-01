import { useMemo, useState } from "react";
import "./infoPanels.css";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

function formatTime(ms) {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
        d.getSeconds()
    ).padStart(2, "0")}`;
}

export default function GraphPanel({ logs = [] }) {
    const [metric, setMetric] = useState("altitude"); // altitude | pressure | speed | distance

    // Ensure chronological order for plotting
    const data = useMemo(() => {
        const ordered = [...logs].sort((a, b) => a.t_ms - b.t_ms);
        return ordered.map((l) => ({
        t_ms: l.t_ms,
        t_label: formatTime(l.t_ms),
        altitude: l.altitude,
        pressure: l.pressure,
        speed: l.speed,
        // distance later
    }));
  }, [logs]);

  return (
    <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 className="panel-title">GRAPH</h2>

            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="altitude">Altitude</option>
            <option value="pressure">Pressure</option>
            <option value="speed">Speed</option>
            </select>
        </div>

        <div style={{ height: 260, marginTop: 10 }}>
            {data.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No logs to graph.</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="t_label"
                    tickMargin={8}
                    minTickGap={20}
                />
                <YAxis />
                <Tooltip
                    labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.t_ms
                        ? new Date(payload[0].payload.t_ms).toLocaleString()
                        : ""
                    }
                />
                <Line type="monotone" dataKey={metric} dot={false} />
                </LineChart>
            </ResponsiveContainer>
            )}
        </div>
    </div>
  );
}
