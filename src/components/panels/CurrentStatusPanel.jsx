
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

export default function CurrentStatusPanel ({ currentStatus }) {

    return (
        <div className="panel">
        <h2 className="panel-title">STATUS</h2>

        {!currentStatus ? (
            <div style={{ marginTop: 12, opacity: 0.8 }}>
            Waiting for telemetry to load...
            </div>
        ) : (
            <div style={{ marginTop: 12 }}>
                <StatusRow label="Flight Time:" value={formatStopwatch(currentStatus.elapsedMs)} />               
                <StatusRow label="Latitude:" value={currentStatus.latitude}/>
                <StatusRow label="Longitude:" value={currentStatus.longitude}/>
                <StatusRow label="Altitude:" value={currentStatus.altitude}/>
                <StatusRow label="Speed:" value={currentStatus.speed}/>
                <StatusRow label="Pressure:" value={currentStatus.pressure}/>
                <StatusRow label="Battery:" value={currentStatus.battery}/>
                <StatusRow label="Distance:" value={currentStatus.distance}/>
                <StatusRow label="Displacement:" value={currentStatus.displacement}/>
                          
            </div>
        )}
        </div>
    );
}