import "./map.css";
import BlimpMap from "./BlimpMap"; 

export default function MapPanel({ blimpPos }) {
  return (
    <div className="panel">
      <h2 className="panel-title">MAP</h2>
      <div className="panel-body">
        <BlimpMap blimpPos={blimpPos} />
      </div>
    </div>
  );
}