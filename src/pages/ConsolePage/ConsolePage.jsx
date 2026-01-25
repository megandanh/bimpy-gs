import "./console.css";
import "../../App.css";
import { useEffect, useState } from "react";
import FlightConfirmModal from "../../components/modals/FlightConfirmModal";
import BimpyLogo from "../../assets/BimpyLogo.png";
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
    
    const onClickStartFlight = () => {
        setIsModalOpen(true);
    };

    const onConfirmStartFlight = () => {
        const start = Date.now();
        setFlightStartTime(start);

        setIsModalOpen(false);
        setIsFlightRunning(true);

        setLogRows([]);
        setLaunchSiteInfo(null);
        setCurrentStatus(null);

        if (isRecordingOn) {
            setFlightId(Date.now());
        } else {
            setFlightId(null);
        }
    };

    const onCancelFlight = () => {
        setIsModalOpen(false);
        setIsRecordingOn(false); 
    }

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

            const row = {
            timestamp,
            altitude: Number(alt.toFixed(2)),
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
            speed: Number((8 + Math.random() * 2).toFixed(2)),
            pressure: Number((1013 + (Math.random() - 0.5) * 2).toFixed(2)),
            flightId: isRecordingOn ? flightId : null,
            };

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
                };
            })

            setLogRows((prev) => [...prev.slice(-300), row]); 
        }, 500); 

        return () => clearInterval(id);
    }, [isFlightRunning, isRecordingOn, flightId]);

    return (
        <div className="console-page">
            <div className="console-header">
                <h2 className="console-logo">BIMPY</h2>
                <div className="console-buttons">
                    <button id="startFlightBtn" onClick={onClickStartFlight}>START FLIGHT</button>
                    <button id="flightAnalysisBtn">ANALYZE</button>
                </div>
            </div>

            <FlightConfirmModal
                isOpen={isModalOpen}
                recordOn={isRecordingOn}
                setRecordingOn={setIsRecordingOn}
                onConfirm={onConfirmStartFlight}
                onCancel={onCancelFlight}
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
                    <CurrentStatusPanel currentStatus={ currentStatus } logRows={ logRows } flightStartTime={flightStartTime} />
                    <RemotePanel />
                </div>
            </div>
        </div>
  );
}
