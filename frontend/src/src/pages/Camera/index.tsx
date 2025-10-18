import Header from "../../components/Header";
import backButton from "../../../assets/img/backPage.png";
import CameraBody from "../../components/CameraBody";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CameraScreen() {
  const navigate = useNavigate();
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    const count = parseInt(localStorage.getItem("imageCount") || "0", 10);
    setImageCount(count);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header title={<img src={backButton} alt="Back" className="ml-2 w-5 h-8" onClick={() => navigate('/')} />} />
      <CameraBody />
      <div className="absolute bottom-4 right-4 text-white text-lg">
        {imageCount}/5
      </div>
    </div>
  );
}
