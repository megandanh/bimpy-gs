import "./console.css";
import { useState } from "react";
import FlightConfirmModal from "../../components/modals/FlightConfirmModal";
import BimpyLogo from "../../assets/BimpyLogo.png";
import FlightMessages from "../../components/panels/FlightMessagesPanel";
import MapPanel from "../../components/panels/MapPanel";


export default function ConsolePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFlightRunning, setIsFlightRunning] = useState(false);
    const [isRecordingOn, setIsRecordingOn] = useState(false);

    const onClickStartFlight = () => {
        setIsModalOpen(true);
    };

    const onConfirmStartFlight = () => {
        setIsModalOpen(false);
        setIsFlightRunning(true);
    }

    const onCancelFlight = () => {
        setIsModalOpen(false);
        setIsRecordingOn(false); 
    }
    return (
        <div className="console">
            <div className="console-header">
                <img src= {BimpyLogo} alt="Bimpy Logo" id="bimpyLogoConsole"/>
                <div className="console-buttons">
                    <button id="startFlightBtn" onClick={onClickStartFlight}>START FLIGHT</button>
                    <button id="flightAnalysisBtn">ANALYZE</button>
                </div>
            </div>

            <FlightConfirmModal
                isOpen={isModalOpen}
                recordOn={isRecordingOn}
                setRecordEnabled={setIsRecordingOn}
                onConfirm={onConfirmStartFlight}
                onCancel={onCancelFlight}
            />

            <div className="console-body">
                <div className="col col-left">
                    <FlightMessages />
                </div>

                <div className="col col-mid">
                    <MapPanel />
                </div>
                
                <div className="col col-right">{/* later */}</div>
            </div>
        </div>
  );
}
