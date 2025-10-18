import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import backButton from "../../../assets/img/backPage.png";

export default function AIGeneration() {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchedImages: string[] = [];
    const imageCount = parseInt(localStorage.getItem("imageCount") || "0", 10);
    for (let i = 1; i <= imageCount; i++) {
      const storedImage = localStorage.getItem(`capturedImage_${i}`);
      if (storedImage) {
        fetchedImages.push(storedImage);
      }
    }
    setImages(fetchedImages);
  }, []);

  const handleGenerate = () => {
    // AI生成ロジックは後で実装
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header title={<img src={backButton} alt="Back" className="ml-2 w-5 h-8" onClick={() => navigate('/')} />} />
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((src, index) => (
            <img key={index} src={src} alt={`Captured ${index + 1}`} className="max-w-full max-h-48 object-contain" />
          ))}
        </div>
        <div className="mt-8">
          <button
            onClick={handleGenerate}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-64"
          >
            これをもとにAI生成を行いますか？
          </button>
        </div>
      </div>
    </div>
  );
}
