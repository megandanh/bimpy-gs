import "./map.css";
import BlimpMap from "./BlimpMap"; 
export default function MapPanel() {
  return (
    <div className="panel">
      <h2 className="panel-title">MAP</h2>

      <div className="panel-body">
        <BlimpMap />
      </div>
    </div>
  );
}
