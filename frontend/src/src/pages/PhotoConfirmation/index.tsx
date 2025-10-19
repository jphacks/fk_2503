
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import backButton from "../../../assets/img/backPage.png";

export default function PhotoConfirmation() {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    const count = parseInt(localStorage.getItem("imageCount") || "0", 10);
    setImageCount(count);
    const storedImage = localStorage.getItem(`capturedImage_${count}`);
    if (storedImage) {
      setImageSrc(storedImage);
    }
  }, []);

  const handleRetake = () => {
    navigate("/camera");
  };

  const handleAiGeneration = () => {
    navigate("/ai-generation");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={<img src={backButton} alt="Back" className="ml-2 w-5 h-8" onClick={() => navigate('/')} />} />
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        {imageSrc && (
          <img src={imageSrc} alt="Captured" className="max-w-full max-h-96 object-contain" />
        )}
        <div className="mt-8 space-y-4 flex flex-col items-center">
          <button
            onClick={handleAiGeneration}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-64"
          >
            AI生成を行いますか
          </button>
          {imageCount < 5 && (
            <button
              onClick={handleRetake}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-64"
            >
              もう一枚撮る
            </button>
          )}
        </div>
        <div className="absolute bottom-4 right-4 text-neutral-900 text-lg">
          {imageCount}/5
        </div>
      </div>
    </div>
  );
}
