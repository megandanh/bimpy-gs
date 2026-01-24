import "./map.css";
import { GoogleMap, Polyline, Circle, useLoadScript } from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useState } from "react";

const containerStyle = { width: "100%", height: "100%" };

export default function BlimpMap({ blimpPos, trail, launchSite, zoom = 16.5 }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const demoLaunch = { lat: 28.60805, lng: -81.19267 };
  const [demoPos, setDemoPos] = useState(demoLaunch);
  const [demoTrail, setDemoTrail] = useState([demoLaunch]);

  useEffect(() => {
    if (blimpPos) return; 
    const id = setInterval(() => {
      setDemoPos((prev) => {
        const next = { lat: prev.lat + 0.00003, lng: prev.lng + 0.00002 };
        setDemoTrail((t) => [...t.slice(-200), next]);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [blimpPos]);

  const pos = blimpPos ?? demoPos;
  const site = launchSite ?? demoLaunch;
  const path = trail ?? demoTrail;

  const mapRef = useRef(null);

  const options = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      mapTypeId: "satellite",
    }),
    []
  );

  useEffect(() => {
    if (!mapRef.current || !pos) return;
    mapRef.current.panTo(pos);
  }, [pos]);

  const dashedLineOptions = useMemo(() => {
    const lineSymbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 1,
      scale: 3,
    };

    return {
      strokeOpacity: 0,
      icons: [{ icon: lineSymbol, offset: "0", repeat: "12px" }],
    };
  }, []);

  if (!isLoaded) return <div style={{ width: "100%", height: "100%" }} />;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={pos}
      zoom={zoom}
      options={options}
      onLoad={(map) => (mapRef.current = map)}
    >
      {/* launch site */}
      <Circle
        center={site}
        radius={6}
        options={{ fillOpacity: 1, strokeOpacity: 0, fillColor: "#000000", zIndex: 2 }}
      />

      {/* path/trail */}
      {path?.length > 1 && <Polyline path={path} options={dashedLineOptions} />}

      {/* current location*/}
      <Circle
        center={pos}
        radius={6}
        options={{ fillOpacity: 1, strokeOpacity: 0, fillColor: "#f14242", zIndex: 4 }}
      />
      <Circle
        center={pos}
        radius={18}
        options={{ fillOpacity: 0.5, strokeOpacity: 0, fillColor: "#f19999ff", zIndex: 3 }}
      />
    </GoogleMap>
  );
}
