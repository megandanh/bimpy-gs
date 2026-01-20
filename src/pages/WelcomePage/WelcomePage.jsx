import "./welcome.css";
import BimpyLogo from "../../assets/BimpyLogo.png";
import BlimpImg from "../../assets/BlimpImg.png";
import StarsBackground from "../../components/StarBackground";

export default function WelcomePage() {
  return (
    <div className="welcome-container">
      <StarsBackground starCount={300} starSpeed={0.35} starSize={1} twinkle pixelationFactor={1} />

      <div className="welcome">
        <img src={BimpyLogo} alt="Bimpy Logo" id="bimpyLogo"/>
        <img src={BlimpImg} alt="Blimp Image" id="blimpImg"/>
        <button id="startButton">START</button>
      </div>
    </div>
  );
}


