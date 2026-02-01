import "./console.css";
import "../../App.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FlightConfirmModal from "../../components/modals/FlightConfirmModal";
import AnalysisModal from "../../components/modals/AnalysisModal";
import FlightMessages from "../../components/panels/FlightMessagesPanel";
import MapPanel from "../../components/panels/MapPanel";
import LogPanel from "../../components/panels/LogPanel";
import LaunchSitePanel from "../../components/panels/LaunchSitePanel";
import CurrentStatusPanel from "../../components/panels/CurrentStatusPanel";
import RemotePanel from "../../components/panels/RemotePanel";

export default function ConsolePage() {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFlightRunning, setIsFlightRunning] = useState(false);
    const [isRecordingOn, setIsRecordingOn] = useState(false);

    const [logRows, setLogRows] = useState([]);
    const [flightId, setFlightId] = useState(null);

    const [launchSiteInfo, setLaunchSiteInfo] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [flightStartTime, setFlightStartTime] = useState(null);

    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState(null);

    const [elapsedMs, setElapsedMs] = useState(0);

    const navigate = useNavigate();
        
    const API = "http://localhost:5176";
    const bufferRef = useRef([]);
    const flushTimerRef = useRef(null);

    const lastPosRef = useRef(null);        
    const launchPosRef = useRef(null);      
    const totalDistanceRef = useRef(0);    

    function haversineMeters(a, b) {
        if (!a || !b) return 0;
        const R = 6371000;
        const toRad = (deg) => (deg * Math.PI) / 180;

        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);

        const lat1 = toRad(a.lat);
        const lat2 = toRad(b.lat);

        const h =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

        return 2 * R * Math.asin(Math.sqrt(h));
    }

    const onClickStartFlight = () => {
        setIsModalOpen(true);
    };

    const onConfirmStartFlight = () => {
        const start = Date.now();
        lastPosRef.current = null;
        launchPosRef.current = null;
        totalDistanceRef.current = 0;

        setFlightStartTime(start);

        setIsModalOpen(false);
        setIsFlightRunning(true);

        setLogRows([]);
        setLaunchSiteInfo(null);
        setCurrentStatus(null);

        if (isRecordingOn) {
            const id = Date.now();
            setFlightId(id);

            fetch(`${API}/api/flights/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ flight_id: String(id), start_time: Date.now() }),
            }).catch(console.error);
        } else {
            setFlightId(null);
        }
    };

    const onCancelFlight = () => {
        setIsModalOpen(false);
        setIsRecordingOn(false); 
    }

    const onStopFlight = () => {
        if (isRecordingOn && flightId) {
            flushLogs()
            .then(() =>
                fetch(`${API}/api/flights/stop`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flight_id: String(flightId),
                    end_time: Date.now(),
                }),
                })
            )
            .catch(console.error);
        }

        setIsFlightRunning(false);
        setFlightStartTime(null);
        setIsRecordingOn(false);
        setFlightId(null);
    };

    async function flushLogs() {
        const rows = bufferRef.current;
        if (!rows.length) return;

        bufferRef.current = [];

        await fetch(`${API}/api/logs/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows }),
        });
    }

    useEffect(() => {
        if (!flightStartTime) {
            setElapsedMs(0);
            return;
        }

        setElapsedMs(Date.now() - flightStartTime);

        const id = setInterval(() => {
            setElapsedMs(Date.now() - flightStartTime);
        }, 250);

        return () => clearInterval(id);
    }, [flightStartTime]);

    useEffect(() => {  
        if (!isFlightRunning) return;

        // DUMMY LOGIC FOR NOW
        let lat = 28.6024;
        let lng = -81.2001;
        let alt = 120.0;

        const id = setInterval(() => {
            lat += 0.00002;
            lng += 0.000015;
            alt += (Math.random() - 0.5) * 0.6;

            const now = new Date();
            const timestamp =
            `${String(now.getHours()).padStart(2, "0")}:` +
            `${String(now.getMinutes()).padStart(2, "0")}:` +
            `${String(now.getSeconds()).padStart(2, "0")}:` +
            `${String(now.getMilliseconds()).padStart(3, "0")}`;

            const pos = { lat, lng };

            const elapsed_ms = flightStartTime ? (Date.now() - flightStartTime) : 0;
            const elapsed_s = elapsed_ms / 1000;

            if (!launchPosRef.current) {
                launchPosRef.current = pos;
                lastPosRef.current = pos;
                totalDistanceRef.current = 0;
            } else if (lastPosRef.current) {
                totalDistanceRef.current += haversineMeters(lastPosRef.current, pos);
                lastPosRef.current = pos;
            }

            const distance_m = totalDistanceRef.current;
            const displacement_m = haversineMeters(launchPosRef.current, pos);

            const battery_pct = Math.max(70, 100 - (elapsed_ms / 900000) * 30 )

            const row = {
                timestamp,
                altitude: Number(alt.toFixed(2)),
                latitude: Number(lat.toFixed(6)),
                longitude: Number(lng.toFixed(6)),
                speed: Number((8 + Math.random() * 2).toFixed(2)),
                pressure: Number((101 + (Math.random() - 0.5) * 2).toFixed(2)),
                battery: Number(battery_pct.toFixed(0)),
                time_elapsed: Number(elapsed_s.toFixed(2)),          // seconds
                distance: Number(distance_m.toFixed(2)),            // meters
                displacement: Number(displacement_m.toFixed(2)),
                flightId: isRecordingOn ? flightId : null,
            };

            if (isRecordingOn && flightId) {
                bufferRef.current.push({
                    flight_id: String(flightId),
                    t_ms: Date.now(),
                    altitude: row.altitude,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    speed: row.speed,
                    pressure: row.pressure,
                    battery: row.battery,
                    time_elapsed: row.time_elapsed,
                    distance: row.distance,
                    displacement: row.displacement,
                });
            }

            setLaunchSiteInfo((prev) => {
                if (prev) return prev; 
                return {
                    timestamp: row.timestamp,
                    latitude: row.latitude,
                    longitude: row.longitude,
                };
            })

            setCurrentStatus((prev) => {
                const launchLat = prev?.launchLat ?? row.latitude;
                const launchLong = prev?.launchLong ?? row.longitude;
                
                return {
                    launchLat,
                    launchLong,
                    timestamp: row.timestamp,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    altitude: row.altitude,
                    speed: row.speed,
                    pressure: row.pressure,
                    battery: row.battery,
                    distance: row.distance,
                    displacement: row.displacement,
                    elapsedMs: elapsed_ms,
                };
            })

            setLogRows(prev => [...prev, row]);
            const latest = logRows[logRows.length - 1];
        }, 500); 

        return () => clearInterval(id);
    }, [isFlightRunning, isRecordingOn, flightId]);

    useEffect(() => {
        if (!isFlightRunning || !isRecordingOn || !flightId) return;

        flushTimerRef.current = setInterval(() => {
            flushLogs().catch(console.error);
        }, 2000); 

        return () => clearInterval(flushTimerRef.current);
    }, [isFlightRunning, isRecordingOn, flightId]);

    return (
        <div className="console-page">
            <div className="console-header">
                <h2 className="console-logo">BIMPY</h2>
                <div className="console-buttons">
                    {!isFlightRunning ? (
                        <>
                        <button id="startFlightBtn" onClick={onClickStartFlight}>START FLIGHT</button>
                        <button
                            id="flightAnalysisBtn"
                            onClick={() => {
                                setSelectedFlight(null);
                                setIsAnalysisOpen(true);
                            }}
                        >
                        ANALYZE
                        </button>
                        </>
                    ) : (
                        <button id="stopFlightBtn" onClick={onStopFlight}>STOP FLIGHT</button>
                    )}
                </div>
            </div>

            <FlightConfirmModal
                isOpen={isModalOpen}
                recordOn={isRecordingOn}
                setRecordingOn={setIsRecordingOn}
                onConfirm={onConfirmStartFlight}
                onCancel={onCancelFlight}
            />

            <AnalysisModal
                isOpen={isAnalysisOpen}
                onClose={() => setIsAnalysisOpen(false)}
                selectedFlight={selectedFlight}
                setSelectedFlight={setSelectedFlight}
                onNext={() => {
                    if (!selectedFlight) return;
                    setIsAnalysisOpen(false);
                    navigate(`/analysis/${selectedFlight.id}`);
                }}
            />

            <div className="console-body">
                <div className="col col-left">
                    <FlightMessages />
                </div>

                <div className="col col-mid">
                    <MapPanel />
                    <LogPanel rows={logRows}/>
                </div>
                
                <div className="col col-right">
                    <LaunchSitePanel launchSiteInfo={ launchSiteInfo } />
                    <CurrentStatusPanel currentStatus={ currentStatus } />
                    <RemotePanel />
                </div>
            </div>
        </div>
  );
}
