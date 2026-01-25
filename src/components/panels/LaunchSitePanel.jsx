import "./launchSite.css";

export default function LaunchSitePanel({ launchSiteInfo }) {
  return (
    <div className="panel">
      <h2 className="panel-title">LAUNCH SITE</h2>

      {!launchSiteInfo ? (
        <div style={{ marginTop: 12, opacity: 0.8 }}>
          Waiting for first telemetry point...
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
            <div className="launch-display">
                <div className="launch-labels">Launch Time:</div> 
                <div className="launch-vals">
                    {launchSiteInfo.timestamp}
                </div>
            </div>
            <div className="launch-display">
                <div className="launch-labels">Latitude:</div> 
                <div className="launch-vals">
                    {launchSiteInfo.latitude}
                </div>
            </div>
            <div className="launch-display">
                <div className="launch-labels">Longitude:</div> 
                <div className="launch-vals">
                    {launchSiteInfo.longitude}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}