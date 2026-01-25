import { useEffect, useState } from "react";

function StatusRow ({ label, value }) {
    return (
        <div className="launch-display">
            <div className="launch-labels">{ label }</div> 
            <div className="launch-vals">
                {value}
            </div>
        </div>
    );
}

function formatStopwatch(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return (
    String(hrs).padStart(2, "0") + ":" +
    String(mins).padStart(2, "0") + ":" +
    String(secs).padStart(2, "0")
  );
}

const R = 6371000; 

function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => deg * Math.PI / 180;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.asin(Math.sqrt(a));

    return R * c; 
}

export default function CurrentStatusPanel ({ currentStatus, logRows, flightStartTime }) {
    let displacement = "";
    let distanceTraveled = "";

    const [elapsedMs, setElapsedMs] = useState(0);

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

    // displacement
    const canCompute =
        currentStatus &&
        Number.isFinite(currentStatus.launchLat) &&
        Number.isFinite(currentStatus.launchLong) &&
        Number.isFinite(currentStatus.latitude) &&
        Number.isFinite(currentStatus.longitude);

    if (canCompute) {
        displacement = haversineDistance(
            currentStatus.launchLat,
            currentStatus.launchLong,
            currentStatus.latitude,
            currentStatus.longitude
        );
    }

    // distance travelled
    if (Array.isArray(logRows) && logRows.length > 1) {
        let total = 0;

        for (let i = 1; i < logRows.length; i++) {
            const a = logRows[i - 1];
            const b = logRows[i];

            if (
                Number.isFinite(a.latitude) &&
                Number.isFinite(a.longitude) &&
                Number.isFinite(b.latitude) &&
                Number.isFinite(b.longitude)
            ) {
                total += haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
            }
        }

        distanceTraveled = total; 
    }

    return (
        <div className="panel">
        <h2 className="panel-title">STATUS</h2>

        {!currentStatus ? (
            <div style={{ marginTop: 12, opacity: 0.8 }}>
            Waiting for telemetry to load...
            </div>
        ) : (
            <div style={{ marginTop: 12 }}>
                {flightStartTime && (
                    <StatusRow label="Flight Time:" value={formatStopwatch(elapsedMs)} />
                )}                
                <StatusRow label="Latitude:" value={currentStatus.latitude}/>
                <StatusRow label="Longitude:" value={currentStatus.longitude}/>
                <StatusRow label="Altitude:" value={currentStatus.altitude}/>
                <StatusRow label="Speed:" value={currentStatus.speed}/>
                <StatusRow label="Pressure:" value={currentStatus.pressure}/>
                {distanceTraveled !== "" && (
                    <StatusRow label="Distance Traveled:" value={`${distanceTraveled.toFixed(2)} m`} />
                )}                
                {displacement !== "" && (
                    <StatusRow label="Displacement:" value={`${displacement.toFixed(2)} m`} />
                )}            
            </div>
        )}
        </div>
    );
}