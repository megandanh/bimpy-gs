import "./remote.css";
import { useEffect, useState } from "react";
import R2D2_ELRS from "../../assets/R2D2_ELRS.png";

export default function RemotePanel({ launchSiteInfo }) {
  
    const [direction, setDirection] = useState(null); // "up" | "down" | "left" | "right" | null

    // LOOP FOR TESTING PURPOSES DONT FORGET TO CHANGE
    useEffect(() => {
        const dirs = ["up", "right", "down", "left"];
        let i = 0;

        const id = setInterval(() => {
        setDirection(dirs[i % dirs.length]);
        i++;
        }, 900);

        return () => clearInterval(id);
    }, []);

    const isActive = (d) => direction === d;

    return (
    <div className="panel">
      <h2 className="panel-title">REMOTE</h2>

      <div className="remote-content">
        <img src={R2D2_ELRS} alt="ELRS Image" id="ELRS-img" />
        <div className="dpad">
          <button className={`dpad-btn up ${isActive("up") ? "active" : ""}`} aria-label="Up">
            ▲
          </button>

          <button className={`dpad-btn left ${isActive("left") ? "active" : ""}`} aria-label="Left">
            ◀
          </button>

          <button className={`dpad-btn right ${isActive("right") ? "active" : ""}`} aria-label="Right">
            ▶
          </button>

          <button className={`dpad-btn down ${isActive("down") ? "active" : ""}`} aria-label="Down">
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}