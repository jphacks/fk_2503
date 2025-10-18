import Header from "../../components/Header";
import backButton from "../../../assets/img/backPage.png";
import CameraBody from "../../components/CameraBody";
import { useNavigate } from "react-router-dom";

export default function CameraScreen() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header title={<img src={backButton} alt="Back" className="ml-2 w-5 h-8" onClick={() => navigate('/')} />} />
      <CameraBody />
    </div>
  );
}
