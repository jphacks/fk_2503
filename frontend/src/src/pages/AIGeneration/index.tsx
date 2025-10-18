import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import backButton from "../../../assets/img/backPage.png";

interface CraftIdea {
  menuName: string;
  steps: string;
  time: string;
  difficulty: string;
  materials: string[];
}

export default function AIGeneration() {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [craftIdea, setCraftIdea] = useState<CraftIdea | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/generate-craft-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageCount: images.length }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate craft ideas.");
      }

      const result = await response.json();
      console.log("Fetched craft idea:", result);
      setCraftIdea(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header title={<img src={backButton} alt="Back" className="ml-2 w-5 h-8" onClick={() => navigate('/')} />} />
      <div className="flex-grow flex flex-col items-center p-4">
        {isLoading ? (
          <p>AIがアイデアを生成中です...</p>
        ) : craftIdea ? (
          <div className="text-left w-full max-w-md p-4 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">メニュー名: {craftIdea.menuName}</h2>
            <p className="mb-2"><strong>材料:</strong> {craftIdea.materials.join(', ')}</p>
            <p className="mb-2"><strong>所要時間:</strong> {craftIdea.time}</p>
            <p className="mb-4"><strong>難易度:</strong> {craftIdea.difficulty}</p>
            <h3 className="text-xl font-bold mb-2">制作手順:</h3>
            <div className="whitespace-pre-wrap">{craftIdea.steps}</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {images.map((src, index) => (
                <img key={index} src={src} alt={`Captured ${index + 1}`} className="max-w-full max-h-48 object-contain" />
              ))}
            </div>
            <button
              onClick={handleGenerate}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-64"
            >
              これをもとにAI生成を行いますか？
            </button>
          </div>
        )}
        <div className="absolute bottom-4 right-4 text-white text-lg">
          {images.length}/5
        </div>
      </div>
    </div>
  );
}
