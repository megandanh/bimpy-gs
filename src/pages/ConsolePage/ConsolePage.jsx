import "./console.css";
import "../../App.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FlightConfirmModal from "../../components/modals/FlightConfirmModal";
import AnalysisModal from "../../components/modals/AnalysisModal";
import FlightMessages from "../../components/panels/FlightMessagesPanel";
import MapPanel from "../../components/panels/MapPanel";
import LogPanel from "../../components/panels/LogPanel";
import VideoFeed from "../../components/panels/VideoFeed";
import LaunchSitePanel from "../../components/panels/LaunchSitePanel";
import CurrentStatusPanel from "../../components/panels/CurrentStatusPanel";
import RemotePanel from "../../components/panels/RemotePanel";
import BatteryPanel from "../../components/panels/BatteryPanel";


export default function ConsolePage() {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFlightRunning, setIsFlightRunning] = useState(false);
    const [isRecordingOn, setIsRecordingOn] = useState(false);

    const [logRows, setLogRows] = useState([]);
    const [flightId, setFlightId] = useState(null);

    const [launchSiteInfo, setLaunchSiteInfo] = useState(null);
    const [flightStartTime, setFlightStartTime] = useState(null);

    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState(null);

    const [elapsedMs, setElapsedMs] = useState(0);

    const [remote, setRemote] = useState({
        ch: Array(12).fill(1500),
        arm: 0,
        // kill: 0,
    });

    const [currentStatus, setCurrentStatus] = useState({
        latitude:     "—",
        longitude:    "—",
        altitude:     "—",
        speed:        "—",
        pressure:     "—",
        rssi:         "—",
        snr:          "—",
        temperature:  "—",
        distance:     "—",
        displacement: "—",
        codes:        "—",
        elapsedMs:    0,
    });

    const [batteryStat, setBatteryStat] = useState({
        bat_mv: 0,
        bat_a: 0,
        bat_mah: 0,
        bat_pct: 0,
    });

    const navigate = useNavigate();
        
    const API = "http://localhost:5176";
    const bufferRef = useRef([]);
    const flushTimerRef = useRef(null);

    const lastPosRef = useRef(null);        
    const launchPosRef = useRef(null);      
    const totalDistanceRef = useRef(0);   
    
    const isFlightRunningRef = useRef(false);
    const flightStartTimeRef = useRef(null);
    const flightIdRef = useRef(null);

    const launchAltRef = useRef(null);



    

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
        isFlightRunningRef.current = true;
        flightStartTimeRef.current = start;

        setIsModalOpen(false);
        setIsFlightRunning(true);
        setLogRows([]);
        setLaunchSiteInfo(null);

        const id = Date.now();
        setFlightId(id);

        fetch(`${API}/api/flights/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ flight_id: String(id), start_time: start }),
        }).catch(console.error);
    };

    const onCancelFlight = () => {
        setIsModalOpen(false);
        setIsRecordingOn(false); 
    }

    const onStopFlight = () => {
        if (flightId) {
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

        isFlightRunningRef.current = false;
        flightStartTimeRef.current = null;

        setIsFlightRunning(false);
        setFlightStartTime(null);
        setFlightId(null);
    };

    function calcAltitude(pressure_pa, temp_c) {
        const P0 = 101325;          
        const T = temp_c + 273.15;  
        const L = 0.0065;           
        const R = 8.31446;          
        const g = 9.80665;          
        const M = 0.0289644;        

        return (T / L) * (1 - Math.pow(pressure_pa / P0, (R * L) / (g * M)));
    }

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
        const ws = new WebSocket("ws://localhost:5177");

        ws.onopen = () => console.log("[WS] open");
        ws.onerror = (e) => console.log("[WS] error", e);

        ws.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data);
                if (msg.type === "ch" && Array.isArray(msg.ch)) {
                    setRemote({
                        ch: msg.ch,
                        arm: msg.arm ? 1 : 0,
                        // kill: msg.kill ? 1 : 0,
                        connection: msg.connection ?? false,
                    });

                    // GPS coords come as integers scaled by 1e7
                    const lat = msg.gps_lat != null ? msg.gps_lat / 1e7 : null;
                    const lng = msg.gps_lon != null ? msg.gps_lon / 1e7 : null;
                    const pos = (lat && lng) ? { lat, lng } : null;

                    // Track distance/displacement while flight is running
                    if (isFlightRunningRef.current && pos) {
                        if (!launchPosRef.current) {
                            launchPosRef.current = pos;
                            lastPosRef.current = pos;
                            totalDistanceRef.current = 0;
                        } else {
                            totalDistanceRef.current += haversineMeters(lastPosRef.current, pos);
                            lastPosRef.current = pos;
                        }
                    }

                    const distance = totalDistanceRef.current;
                    const displacement = haversineMeters(launchPosRef.current, pos);
                    const elapsed = flightStartTimeRef.current
                        ? Date.now() - flightStartTimeRef.current
                        : 0;

                    const altitude = (msg.pressure != null && msg.temp != null)
                        ? parseFloat(calcAltitude(msg.pressure, msg.temp).toFixed(1))
                        : null;

                    if (isFlightRunningRef.current && launchAltRef.current === null && altitude != null) {
                        launchAltRef.current = altitude;
                    }

                    if (!isFlightRunningRef.current) {
                        launchAltRef.current = null;
                    }

                    const relativeAlt = altitude != null && launchAltRef.current != null
                        ? (altitude - launchAltRef.current).toFixed(1)
                        : null;

                    setCurrentStatus({
                        latitude:     lat != null ? lat.toFixed(6) : "—",
                        longitude:    lng != null ? lng.toFixed(6) : "—",
                        altitude:     relativeAlt != null ? `${relativeAlt} m` : "—", 
                        speed:        msg.gps_spd != null ? `${msg.gps_spd}` : "—",
                        pressure:     msg.pressure != null ? `${msg.pressure} Pa` : "—",
                        battery:      msg.bat_pct != null ? `${msg.bat_pct}%` : "—",
                        rssi:         msg.rssi != null ? `${msg.rssi} dBm` : "—",
                        snr:          msg.snr != null ? `${msg.snr} dB` : "—",
                        temperature:  msg.temp != null ? `${msg.temp} °C` : "—",
                        distance:     isFlightRunningRef.current ? `${distance.toFixed(1)} m` : "—",
                        displacement: isFlightRunningRef.current ? `${displacement.toFixed(1)} m` : "—",
                        codes:        msg.codes ?? "—",
                        elapsedMs:    elapsed,
                    });

                    setBatteryStat({
                        bat_mv:         msg.bat_mv != null ? `${msg.bat_mv}` : "—",
                        bat_a:          msg.bat_a != null ? `${msg.bat_a} ` : "—",
                        bat_mah:        msg.bat_mah != null ? `${msg.bat_mah}` : "—",
                        bat_pct:        msg.bat_pct != null ? `${msg.bat_pct} %` : "—",                        
                    })

                    if (isFlightRunningRef.current) {
                        const now = new Date();
                        const timestamp = String(now.getHours()).padStart(2, "0") + ":" +
                                        String(now.getMinutes()).padStart(2, "0") + ":" +
                                        String(now.getSeconds()).padStart(2, "0") + ":" +
                                        String(now.getMilliseconds()).padStart(3, "0");

                        const row = {
                            timestamp,
                            altitude: relativeAlt ?? "—",
                            latitude:    lat != null ? lat.toFixed(6) : "—",
                            longitude:   lng != null ? lng.toFixed(6) : "—",
                            speed:       msg.gps_spd ?? "—",
                            pressure:    msg.pressure ?? "—",
                            battery:     msg.bat_pct != null ? `${msg.bat_pct}%` : "—",
                            rssi:        msg.rssi ?? "—",
                            snr:         msg.snr ?? "—",
                            temperature: msg.temp ?? "—",
                            distance:    distance.toFixed(1),
                            codes:       msg.codes ?? "—",
                        };

                        setLogRows(prev => [...prev, row]);

                        // Buffer for DB save
                        bufferRef.current.push({
                            flight_id:    String(flightId),
                            t_ms:         Date.now(),
                            altitude: relativeAlt != null ? parseFloat(relativeAlt) : null,
                            latitude:     lat,
                            longitude:    lng,
                            speed:        msg.gps_spd ?? null,
                            pressure:     msg.pressure ?? null,
                            battery:      msg.bat_pct ?? null,
                            rssi:         msg.rssi ?? null,
                            snr:          msg.snr ?? null,
                            temperature:  msg.temp ?? null,
                            distance:     distance,
                            displacement: displacement,
                            codes:        msg.codes ?? null,
                        });
                    }

                    // Set launch site on first GPS fix of a flight
                    if (isFlightRunningRef.current && pos) {
                        setLaunchSiteInfo((prev) => {
                            if (prev) return prev;
                            return { latitude: lat, longitude: lng };
                        });
                    }
                }
            } catch (err) {
                console.log("[WS] bad message", evt.data);
            }
        };
   
        return () => ws.close();
    }, []);

    

    useEffect(() => {
        if (!isFlightRunning || !flightId) return;

        flushTimerRef.current = setInterval(() => {
            flushLogs().catch(console.error);
        }, 2000);

        return () => clearInterval(flushTimerRef.current);
    }, [isFlightRunning, flightId]);

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
                    {/* <FlightMessages /> */}
                    <VideoFeed />
                    <RemotePanel remote={remote}/>
                    <BatteryPanel battery={batteryStat}/>
                </div>

                <div className="col col-mid">
                    <MapPanel blimpPos={
                        currentStatus.latitude !== "—" && currentStatus.longitude !== "—"
                            ? { lat: parseFloat(currentStatus.latitude), lng: parseFloat(currentStatus.longitude) }
                            : null
                    } />
                    <LogPanel rows={logRows}/>
                </div>
                
                <div className="col col-right">
                    <LaunchSitePanel launchSiteInfo={ launchSiteInfo } />
                    <CurrentStatusPanel currentStatus={ currentStatus } />
                </div>
            </div>
        </div>
  );
}
