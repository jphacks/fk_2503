import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import backButton from "../../../assets/img/backPage.png";
import { getApiBase, dataUrlToBlob } from "../../lib/api";

interface DIYIdea {
  title: string;
  description: string;
  materials: string[];
  tools: string[];
  steps: string[];
  difficulty?: string;
  estimated_time_minutes?: number;
}

interface ModelAsset {
  model_url?: string | null;
  preview_image_url?: string | null;
  format?: string | null;
}

interface GenerateResponse {
  model: ModelAsset;
  ideas: DIYIdea[];
}

export default function AIGeneration() {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [generateModel, setGenerateModel] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
    setErrorMessage(null);
    setSelectedIndex(null);
    try {
      const apiBase = getApiBase();
      const form = new FormData();
      const desc = description && description.trim().length > 0 ? description : "ユーザー未入力";
      form.append("description", desc);
      form.append("generate_model", String(generateModel));

      // Convert data URLs to Blob and append
      for (let i = 0; i < images.length; i++) {
        const dataUrl = images[i];
        const blob = await dataUrlToBlob(dataUrl);
        form.append("images", blob, `image_${i + 1}.jpg`);
      }

      const response = await fetch(`${apiBase}/v1/generate`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'API request failed');
      }

      const json: GenerateResponse = await response.json();
      setResult(json);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header title={<img src={backButton} alt="Back" className="ml-2 w-5 h-8" onClick={() => navigate('/')} />} />
      <div className="flex-grow flex flex-col items-center p-4">
        {isLoading ? (
          <div className="w-full max-w-2xl p-6 bg-gray-800 rounded text-center">
            <p>AIがアイデアを生成中です...</p>
          </div>
        ) : result ? (
          <div className="text-left w-full max-w-5xl p-4 bg-gray-800 rounded-lg space-y-6">
            {result.model?.preview_image_url && (
              <div>
                <h3 className="text-xl font-bold mb-2">3Dプレビュー</h3>
                <img src={result.model.preview_image_url} alt="3D preview" className="max-w-full max-h-80 object-contain" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold mb-4">DIYアイデア</h3>
              {/* Grid of idea cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.ideas.map((idea, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`text-left p-4 rounded border transition-colors ${selectedIndex===idx? 'border-blue-400 bg-gray-700' : 'border-gray-600 bg-gray-700 hover:border-blue-300'}`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-lg font-bold pr-2 line-clamp-2">{idea.title}</h4>
                      <span className="text-xs opacity-80 whitespace-nowrap">{idea.difficulty || ''}{idea.estimated_time_minutes ? `/${idea.estimated_time_minutes}分` : ''}</span>
                    </div>
                    <p className="mt-2 text-sm opacity-90 line-clamp-3">{idea.description}</p>
                    {idea.materials?.length ? (
                      <p className="mt-2 text-xs"><strong>材料:</strong> {idea.materials.slice(0,4).join(', ')}{idea.materials.length>4?' …':''}</p>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Detail panel for selected idea */}
              {selectedIndex !== null && result.ideas[selectedIndex] && (
                <div className="mt-6 p-4 rounded bg-gray-700 border border-gray-600">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold">{result.ideas[selectedIndex].title}</h4>
                    <button className="text-sm underline" onClick={() => setSelectedIndex(null)}>一覧に戻る</button>
                  </div>
                  <p className="mt-2 opacity-90">{result.ideas[selectedIndex].description}</p>
                  {result.ideas[selectedIndex].materials?.length ? (
                    <p className="mt-2 text-sm"><strong>材料:</strong> {result.ideas[selectedIndex].materials.join(', ')}</p>
                  ) : null}
                  {result.ideas[selectedIndex].tools?.length ? (
                    <p className="mt-1 text-sm"><strong>工具:</strong> {result.ideas[selectedIndex].tools.join(', ')}</p>
                  ) : null}
                  {result.ideas[selectedIndex].steps?.length ? (
                    <div className="mt-3 text-sm">
                      <strong>制作手順</strong>
                      <ol className="list-decimal ml-5 mt-2 space-y-1">
                        {result.ideas[selectedIndex].steps.map((s, i) => (<li key={i}>{s}</li>))}
                      </ol>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {images.map((src, index) => (
                <img key={index} src={src} alt={`Captured ${index + 1}`} className="max-w-full max-h-48 object-contain" />
              ))}
            </div>
            <div className="w-full max-w-2xl mx-auto text-left mb-4">
              <label className="block text-sm mb-1">説明（材質・状態・数など）</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-2 rounded bg-gray-800 border border-gray-600"></textarea>
              <label className="mt-2 inline-flex items-center gap-2">
                <input type="checkbox" checked={generateModel} onChange={(e) => setGenerateModel(e.target.checked)} />
                3Dモデルも生成する（トークン消費あり）
              </label>
            </div>
            <button
              onClick={handleGenerate}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-64"
            >
              これをもとにAI生成を行いますか？
            </button>
            {errorMessage && (
              <div className="mt-4 text-red-400 text-sm">{errorMessage}</div>
            )}
          </div>
        )}
        <div className="absolute bottom-4 right-4 text-white text-lg">
          {images.length}/5
        </div>
      </div>
    </div>
  );
}
