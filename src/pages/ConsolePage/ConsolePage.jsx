import "./console.css";
import FlightMessages from "../../components/panels/FlightMessagesPanel";

export default function ConsolePage() {
  return (
    <div className="console">
      <div className="col col-left">
        <FlightMessages />
      </div>

      <div className="col col-mid">{/* later */}</div>
      <div className="col col-right">{/* later */}</div>
    </div>
  );
}
