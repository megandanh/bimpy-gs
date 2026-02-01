import "./analysis.css";
import "../../App.css";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FlightPanel from "../../components/AnalysisPanels/FlightPanel";
import LaunchPanel from "../../components/AnalysisPanels/LaunchPanel";
import FlightSummaryPanel from "../../components/AnalysisPanels/FlightSummaryPanel";
import LogPanel from "../../components/AnalysisPanels/LogPanel";
import GraphPanel from "../../components/AnalysisPanels/GraphPanel";

const API = "http://localhost:5176";

export default function AnalysisPage () {
    const { flightId } = useParams();
    const navigate = useNavigate();

    const [logs, setLogs] = useState([]);
    const [flight, setFlight] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!flightId) navigate("/console");
    }, [flightId, navigate]);

    useEffect(() => {
        if (!flightId) return;
        setLoading(true);

        Promise.all([
            fetch(`${API}/api/flights`).then(r => r.json()),
            fetch(`${API}/api/flights/${flightId}/logs`).then(r => r.json()),
        ])
        .then(([flightRes, logsRes]) => {
            const f = (flightRes.flights || []).find(
                x => String(x.id) === String(flightId)
            );
            setFlight(f || { id: flightId });
            setLogs(logsRes.logs || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [flightId]);

    // newest first for top-right
    const logsNewestFirst = useMemo(
        () => [...logs].sort((a, b) => b.t_ms - a.t_ms),
        [logs]
    );

    return (
        <div className="analysis-page">
            <div className="analysis-header">
                <h2 className="analysis-logo">BIMPY</h2>
            </div>

            <div className="analysis-body">
                <div className="col col-left">
                    <FlightPanel flight={flight} loading={loading} />
                    <LaunchPanel logs={logs} loading={loading} />
                    <FlightSummaryPanel flight={flight} logs={logs} loading={loading} />
                </div>
                <div className="col col-right">
                    <LogPanel rows={logsNewestFirst} />
                    <GraphPanel logs={logs} />
                </div>

            </div>
            
        </div>
    );
}