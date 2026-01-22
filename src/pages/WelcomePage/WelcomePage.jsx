import "./welcome.css";
import { useNavigate } from "react-router-dom";
import BimpyLogo from "../../assets/BimpyLogo.png";
import BlimpImg from "../../assets/BlimpImg.png";
import StarBackground from "../../components/StarBackground";

export default function WelcomePage() {
  const navigate = useNavigate();
  return (
    <div className="welcome-container">
      <StarBackground starCount={300} starSpeed={0.35} starSize={1} twinkle pixelationFactor={1} />

      <div className="welcome">
        <img src={BimpyLogo} alt="Bimpy Logo" id="bimpyLogo"/>
        <img src={BlimpImg} alt="Blimp Image" id="blimpImg"/>
        <button id="startButton" onClick={() => navigate("/console")}>START</button>
      </div>
    </div>
  );
}