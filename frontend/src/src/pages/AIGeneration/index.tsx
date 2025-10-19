import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const hasPreview = Boolean(result?.model?.preview_image_url);

  return (
    <div className="relative flex flex-col min-h-screen bg-white text-black">
      {/* 戻るボタンのみ（上部バーなし） */}
      <img
        src={backButton}
        alt="Back"
        className="absolute top-4 left-4 w-5 h-8 cursor-pointer"
        onClick={() => navigate('/')}
      />
      <div className="flex-grow flex flex-col items-center p-4">
        {isLoading ? (
          <div className="w-full max-w-5xl p-6 bg-gray-100 rounded">
            <p className="text-center mb-4">AIがアイデアを生成中です...</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
              <div className="lg:col-span-2 space-y-3">
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="h-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-28 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ) : result ? (
          <div className="text-left w-full max-w-5xl p-2">
            {selectedIndex !== null ? (
              <div>
                <button className="text-sm underline mb-4" onClick={() => setSelectedIndex(null)}>一覧に戻る</button>
                <h2 className="text-2xl font-bold mb-4">{result.ideas[selectedIndex].title}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* 左：完成品（モック） */}
                  <div>
                    <h3 className="text-xl font-bold mb-2">完成品</h3>
                    <div className="w-full h-80 rounded-md bg-gray-200" />
                  </div>
                  {/* 右：つくりかた */}
                  <div>
                    <h3 className="text-xl font-bold mb-2">つくりかた</h3>
                    {/* 材料 */}
                    {result.ideas[selectedIndex].materials?.length ? (
                      <div className="mb-4">
                        <div className="font-semibold mb-1">材料</div>
                        <ul className="flex flex-wrap gap-2">
                          {result.ideas[selectedIndex].materials.map((m, i) => (
                            <li key={i} className="px-2 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm">{m}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {/* 工具 */}
                    {result.ideas[selectedIndex].tools?.length ? (
                      <div className="mb-4">
                        <div className="font-semibold mb-1">工具</div>
                        <ul className="flex flex-wrap gap-2">
                          {result.ideas[selectedIndex].tools.map((t, i) => (
                            <li key={i} className="px-2 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm">{t}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {/* 手順（小学生でもわかりやすく） */}
                    {result.ideas[selectedIndex].steps?.length ? (
                      <ol className="space-y-3">
                        {result.ideas[selectedIndex].steps.map((s, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">{i+1}</span>
                            <p className="leading-relaxed">
                              {s}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    {/* できあがり */}
                    <div className="mt-4 inline-block px-3 py-1 bg-red-500 text-white rounded-full text-sm">できあがり！</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">生成結果</h2>
                  <span className="text-xs opacity-80">{new Date().toLocaleString()}</span>
                </div>
                {hasPreview ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 3D プレビュー（実プレビュー時のみ） */}
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-bold mb-2">3Dプレビュー</h3>
                  <img
                    src={result.model!.preview_image_url as string}
                    alt="3D preview"
                    className="w-full max-h-80 object-contain"
                  />
                  {result.model!.format && (
                    <div className="mt-2 text-xs opacity-80">形式: {result.model!.format}</div>
                  )}
                </div>

                {/* DIY アイデア */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">DIYアイデア</h3>
                  </div>
                  {/* アイデア一覧（枠なし・最小スタイル） */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {result.ideas.map((idea, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedIndex(idx)}
                        className={`text-left p-2 rounded transition-colors hover:bg-gray-100 ${selectedIndex===idx? 'ring-1 ring-blue-400' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-lg font-bold pr-2 line-clamp-2">{idea.title}</h4>
                          <span className="text-xs opacity-80 whitespace-nowrap">
                            {idea.difficulty || ''}{idea.estimated_time_minutes ? `/${idea.estimated_time_minutes}分` : ''}
                          </span>
                        </div>
                        <p className="mt-2 text-sm opacity-90 line-clamp-3">{idea.description}</p>
                        {idea.materials?.length ? (
                          <p className="mt-2 text-xs"><strong>材料:</strong> {idea.materials.slice(0,4).join(', ')}{idea.materials.length>4?' …':''}</p>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  {/* 詳細はフルスクリーン切り替えで表示 */}
                </div>
              </div>
            ) : (
              <div>
                {/* DIY アイデア（3D未生成時: 各カードにモック） */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold">DIYアイデア</h3>
                </div>
                {/* アイデアカード（各カードにモック3D、枠なし） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                  {result.ideas.map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`text-left p-2 rounded transition-colors hover:bg-gray-100 ${selectedIndex===idx? 'ring-1 ring-blue-400' : ''}`}
                    >
                      {/* モック3Dプレビュー（枠・文言なし） */}
                      <div className="h-28 w-full rounded-md bg-gray-200 flex items-center justify-center mb-3" />
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-lg font-bold pr-2 line-clamp-2">{idea.title}</h4>
                        <span className="text-xs opacity-80 whitespace-nowrap">
                          {idea.difficulty || ''}{idea.estimated_time_minutes ? `/${idea.estimated_time_minutes}分` : ''}
                        </span>
                      </div>
                      <p className="mt-2 text-sm opacity-90 line-clamp-3">{idea.description}</p>
                      {idea.materials?.length ? (
                        <p className="mt-2 text-xs"><strong>材料:</strong> {idea.materials.slice(0,4).join(', ')}{idea.materials.length>4?' …':''}</p>
                      ) : null}
                    </button>
                  ))}
                </div>

                {/* 詳細はフルスクリーン切り替えで表示 */}
              </div>
            )}
              </>
            )}
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
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-2 rounded bg-white border border-gray-300"></textarea>
              <label className="mt-2 inline-flex items-center gap-2">
                <input type="checkbox" checked={generateModel} onChange={(e) => setGenerateModel(e.target.checked)} />
                3Dモデルも生成する（トークン消費あり）
              </label>
            </div>
            <button
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-64"
            >
              これをもとにAI生成を行いますか？
            </button>
            {errorMessage && (
              <div className="mt-4 text-red-400 text-sm">{errorMessage}</div>
            )}
          </div>
        )}
        <div className="absolute bottom-4 right-4 text-black text-lg">
          {images.length}/5
        </div>
      </div>
    </div>
  );
}
