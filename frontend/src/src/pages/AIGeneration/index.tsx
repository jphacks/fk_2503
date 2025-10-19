import { useEffect, useState, useRef, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import backButton from "../../../assets/img/backPage.png";
import { getApiBase, dataUrlToBlob } from "../../lib/api";
import OBJViewer from "../../components/OBJViewer";

interface StepItem { text: string; operation?: string }

interface DIYIdea {
  title: string;
  description: string;
  materials: string[];
  tools: string[];
  steps: (string | StepItem)[];
  difficulty?: string;
  estimated_time_minutes?: number;
  // 追加情報（APIが未対応なら未定義）
  size_note?: string; // 例: "縦19.5cm × 横24.5cm × 奥行16cm"
  usage?: string;     // 例: "インテリア、プレゼント、自由研究など"
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
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [guideCompleted, setGuideCompleted] = useState<boolean>(false);
  // 詳細ページの「完成！」を最終行で中央にするための判定
  const detailFlowRef = useRef<HTMLOListElement | null>(null);
  const doneItemRef = useRef<HTMLLIElement | null>(null);
  const [doneCentered, setDoneCentered] = useState(false);
  const [showDoneArrow, setShowDoneArrow] = useState(true);

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

  // アイデアが切り替わったらステップをリセット
  useEffect(() => {
    setStepIndex(0);
    // 詳細/一覧へ切り替え時はページ先頭へスクロール
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (_) {
      // no-op (SSR/非ブラウザ環境対策)
    }
  }, [selectedIndex]);

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

  // 最終行で「完成！」だけになったとき中央寄せにする
  useEffect(() => {
    const compute = () => {
      const list = detailFlowRef.current;
      const doneEl = doneItemRef.current;
      if (!list || !doneEl) return;
      // 最終行のステップ数（step-itemのみカウント）
      const steps = Array.from(list.querySelectorAll(':scope > li.step-item')) as HTMLElement[];
      if (steps.length === 0) {
        setDoneCentered(true);
        setShowDoneArrow(false);
        return;
      }
      const lastTop = steps[steps.length - 1].offsetTop;
      const lastRowSteps = steps.filter((el) => el.offsetTop === lastTop);
      const isRowFull = lastRowSteps.length >= 3; // フル（3つ）なら中央に、空きがあるならスロットに入れる
      setShowDoneArrow(isRowFull);

      // 完成テキストの行に他の要素が存在するか（arrowやstepを含む）
      const doneTop = doneEl.offsetTop;
      const sameRowPeers = Array.from(list.children).filter((el) => (el as HTMLElement).offsetTop === doneTop && el !== doneEl);
      const isDoneAlone = sameRowPeers.length === 0;
      setDoneCentered(isRowFull || isDoneAlone);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [selectedIndex, result]);

  const hasPreview = Boolean(result?.model?.preview_image_url);
  const modelFormat = (result?.model?.format || '').toLowerCase();
  const modelUrl = result?.model?.model_url || undefined;
  const hasObjModel = Boolean(modelUrl && modelFormat.includes('obj'));

  // 難易度→星の数（1〜5）へ簡易変換
  const getStarCount = (difficulty?: string): number => {
    if (!difficulty) return 0;
    const d = difficulty.toLowerCase();
    if (/(very\s*easy|超簡単|初心者|かんたん|易)/.test(d)) return 2;
    if (/(easy|簡単|やさしめ)/.test(d)) return 3;
    if (/(medium|普通|中)/.test(d)) return 3;
    if (/(hard|難|むずかしい)/.test(d)) return 4;
    if (/(very\s*hard|超難|上級)/.test(d)) return 5;
    return 3;
  };
  const Star = ({filled}:{filled:boolean}) => (
    <span className={filled?"text-yellow-500":"text-neutral-300"}>★</span>
  );

  const getMaterialIcon = (name: string): string => {
    const n = name.toLowerCase();
    if (/(木|板|wood)/.test(n)) return '🪵';
    if (/(釘|ネジ|ﾈｼﾞ|screw|nail)/.test(n)) return '🔩';
    if (/(塗料|ペンキ|paint|ニス)/.test(n)) return '🎨';
    if (/(土|soil|砂|砂利)/.test(n)) return '🪴';
    if (/(植物|苗|plant|花)/.test(n)) return '🌿';
    if (/(のこぎり|鋸|saw)/.test(n)) return '🪚';
    if (/(ハンマー|金槌|hammer)/.test(n)) return '🔨';
    if (/(ドライバ|ドライバー|driver|ねじ回し)/.test(n)) return '🪛';
    if (/(メジャー|定規|ruler|measure)/.test(n)) return '📏';
    return '🧩';
  };

  const getStepText = (s: string | StepItem): string => (typeof s === 'string' ? s : (s?.text || ''));
  const getStepOp = (s: string | StepItem): string | undefined => (typeof s === 'string' ? undefined : s?.operation);
  const opImageMap: Record<string, string> = {
    '貼り付ける': '/assets/ops/セロハンテープ.png',
    'のりを塗る': '/assets/ops/のりで塗る.png',
    '切る': '/assets/ops/はさみで切る.png',
    '色を塗る': '/assets/ops/絵の具で色を塗る.png',
    '削る': '/assets/ops/削る.png',
    'その他': '/assets/ops/その他.png',
  };
  const getOpImage = (op?: string): string | undefined => (op ? opImageMap[op] : undefined);

  // 無造作風のオフセット表現（インデックスに応じて少しずらす）
  const scatterClass = (i: number): string => {
    const m = i % 3;
    if (m === 1) return "-translate-x-3 md:-translate-x-6 -rotate-1 md:-rotate-2";
    if (m === 2) return "translate-x-3 md:translate-x-6 rotate-1 md:rotate-2";
    return "";
  };
  const arrowScatterClass = (i: number): string => {
    const m = i % 3;
    if (m === 1) return "-rotate-3";
    if (m === 2) return "rotate-3";
    return "";
  };

  const bgStyle: CSSProperties = {
    backgroundImage: 'url(/assets/background.jpg)',
    backgroundSize: '100% auto', // 横幅いっぱいに合わせ、縦は自動
    backgroundRepeat: 'repeat-y', // 縦方向に継ぎ足してスクロール感を出す
    backgroundPosition: 'top center',
    backgroundAttachment: 'scroll'
  };

  return (
    <div className="relative flex flex-col min-h-screen text-black font-pop" style={bgStyle}>
      {/* 左上の戻るボタン：一覧=ホームへ、詳細=一覧へ */}
      <img
        src={backButton}
        alt="Back"
        className="absolute top-4 left-4 w-5 h-8 cursor-pointer"
        onClick={() => { if (selectedIndex !== null) setSelectedIndex(null); else navigate('/'); }}
      />
      <div className="flex-grow flex flex-col items-center p-4">
        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center py-16">
            <img src="/assets/frog.png" alt="カエルのイラスト" className="w-40 h-40 md:w-64 md:h-64 object-contain animate-bounce" />
            <div className="mt-3 text-3xl md:text-5xl font-extrabold text-neutral-900">AIがアイデアを生成中です…</div>
          </div>
        ) : result ? (
          <div className="text-left w-full max-w-none px-1 md:px-6 text-[17px] md:text-[18px]">
            {selectedIndex !== null ? (
              <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
                <div className="text-center mt-10 mb-8">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900">{result.ideas[selectedIndex].title}</h1>
                </div>
                {/* ヒーロー（完成図 2/3 + 必要材料 1/3） */}
                <section className="rounded-2xl overflow-visible bg-transparent p-0 md:p-0 min-h-[85vh]">
                  <div className="relative">
                    {/* 重なり感のある“紙”背景（全体に適用） */}
                    <div className="absolute inset-0 -z-10">
                      <div className="absolute -left-6 -top-6 w-[104%] h-[92%] rounded-2xl bg-red-200 shadow-lg rotate-[3deg]" />
                      <div className="absolute -left-3 -top-3 w-[102%] h-[94%] rounded-2xl bg-blue-200 shadow-lg -rotate-[2deg]" />
                      <div className="absolute inset-0 rounded-2xl bg-yellow-100 shadow-xl" />
                    </div>
                    <div className="relative z-10 p-3 md:p-6">
                      {/* 共通の枠で一体化 */}
                      <div className="rounded-2xl border-4 border-amber-700 bg-amber-50/80 shadow-lg p-4 md:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start h-full">
                    {/* 完成図（2/3） */}
                    <div className="lg:col-span-2 h-full">
                      <div className="relative w-full h-full min-h-[70vh]">
                        {/* top paper (main frame) */}
                        <div className="relative w-full h-full rounded-2xl bg-white/90 overflow-hidden shadow-lg">
                          {/* 画像エリアの背景色 */}
                          <div className="absolute inset-0 bg-amber-50" />
                          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-orange-500 text-white text-xs md:text-sm font-extrabold shadow">完成イメージ</span>
                        {hasPreview ? (
                          <img src={result.model!.preview_image_url as string} alt="完成イメージ" className="w-full h-full object-contain" />
                        ) : hasObjModel ? (
                          <OBJViewer src={modelUrl as string} className="w-full h-full" wireColor="#444" bgColor="transparent" />
                        ) : (
                          <OBJViewer src="/mock3d/mock.obj" className="w-full h-full" wireColor="#444" bgColor="transparent" />
                        )}
                        </div>
                      </div>
                    </div>
                    {/* 必要材料（1/3：縦並び、丸アイコン＋文字） */}
                    <div className="lg:col-span-1 max-h-[78vh] overflow-auto pr-1 relative z-40 self-start">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 mb-4">必要な材料</h2>
                      <ul className="space-y-3">
                        {(result.ideas[selectedIndex].materials || []).slice(0,20).map((m, i) => (
                          <li key={i} className="flex items-center gap-4 px-3 py-3 rounded-md bg-transparent">
                            <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neutral-900 text-white grid place-items-center text-lg md:text-xl">{getMaterialIcon(m)}</span>
                            <span className="text-neutral-900 text-lg md:text-xl font-extrabold font-pop">{m}</span>
                          </li>
                        ))}
                        {(!result.ideas[selectedIndex].materials || result.ideas[selectedIndex].materials.length===0) && (
                          <li className="text-base md:text-lg text-neutral-600">材料情報がありません</li>
                        )}
                      </ul>
                    </div>
                        </div>
                        {/* 詳細情報（完成サイズ・時間・用途・難易度） */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-neutral-900 w-full">
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xl md:text-2xl font-bold">完成サイズ</span>
                            <span className="text-3xl md:text-4xl font-extrabold">{result.ideas[selectedIndex].size_note || '—'}</span>
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xl md:text-2xl font-bold">制作時間</span>
                            <span className="text-3xl md:text-4xl font-extrabold">{result.ideas[selectedIndex].estimated_time_minutes ? `${result.ideas[selectedIndex].estimated_time_minutes}分` : '—'}</span>
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xl md:text-2xl font-bold">用途</span>
                            <span className="text-3xl md:text-4xl font-extrabold">{result.ideas[selectedIndex].usage || '—'}</span>
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xl md:text-2xl font-bold">難易度</span>
                            <span className="text-3xl md:text-4xl font-extrabold">
                              {Array.from({length:5}).map((_,i)=>(<Star key={i} filled={i < getStarCount(result.ideas[selectedIndex].difficulty)} />))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 必要なもの（重複のため削除） */}

                {/* スライド式ガイドは全画面モードのみ（ここにはボタンのみ表示） */}
                {result.ideas[selectedIndex].steps?.length ? (
                  <button
                    onClick={() => { setStepIndex(-1); setGuideOpen(true); }}
                    className="fixed bottom-6 right-6 z-20 rounded-full w-12 h-12 shadow bg-neutral-900 text-white grid place-items-center"
                    aria-label="ガイドモードを開始"
                    title="ガイドモードを開始"
                  >
                    ▶
                  </button>
                ) : null}

                {/* 手順（横並びフロー＋丸矢印） */}
                {result.ideas[selectedIndex].steps?.length ? (
                  <section className="mt-12">
                    <h3 className="mt-16 md:mt-24 text-4xl md:text-5xl font-extrabold text-neutral-900 text-center mb-6">つくりかた</h3>
                    {/* ゆるやかな波線のセパレーター（見出しの下に配置） */}
                    <div className="mb-14 flex justify-center">
                      <svg
                        viewBox="0 0 1200 40"
                        className="w-[99.5%] h-10 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M0 20 C 100 0, 200 40, 300 20 S 500 0, 600 20 S 800 40, 900 20 S 1100 0, 1200 20" />
                      </svg>
                    </div>
                    <ol ref={detailFlowRef} className="flex flex-wrap items-center gap-4 md:gap-6">
                      {result.ideas[selectedIndex].steps.flatMap((s, i, arr) => {
                        const text = getStepText(s as any);
                        const op = getStepOp(s as any);
                        const img = getOpImage(op);
                        const last = i === arr.length - 1;
                        const liStep = (
                          <li key={`step-${i}`} className={`step-item w-[260px] sm:w-[300px] md:w-[340px] text-center transform ${scatterClass(i)}`}>
                            <div className="mb-2 text-neutral-700 font-bold">STEP {i+1}</div>
                            {img ? (
                              <img src={img} alt={op || 'step'} className="mx-auto w-48 h-48 md:w-56 md:h-56 object-contain" />
                            ) : (
                              <div className="mx-auto w-48 h-48 md:w-56 md:h-56 bg-white/70" />
                            )}
                            <div className="mt-3 text-xl md:text-2xl font-extrabold leading-9 whitespace-pre-wrap">{text}</div>
                          </li>
                        );
                        const liArrow = !last ? (
                          <li key={`arrow-${i}`} className={`shrink-0 ${arrowScatterClass(i)} arrow`} aria-hidden>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-400 shadow flex items-center justify-center text-white text-2xl">→</div>
                          </li>
                        ) : [];
                        return [liStep, liArrow] as any;
                      })}
                      {result.ideas[selectedIndex].steps?.length ? (
                        <>
                          {showDoneArrow && (
                            <li key={`arrow-done`} className={`shrink-0 ${arrowScatterClass(result.ideas[selectedIndex].steps.length)} arrow`} aria-hidden>
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-400 shadow flex items-center justify-center text-white text-2xl">→</div>
                            </li>
                          )}
                          <li
                            key="done"
                            ref={doneItemRef}
                            className={`${doneCentered ? 'w-full flex justify-center' : 'w-[260px] sm:w-[300px] md:w-[340px]'} px-4 py-8 md:py-12 text-center done-item`}
                          >
                            <div className="font-extrabold text-emerald-600">
                              <div className="text-5xl md:text-6xl">完成！</div>
                              <div className="text-4xl md:text-5xl mt-2">よくできました！</div>
                            </div>
                          </li>
                        </>
                      ) : null}
                    </ol>
                  </section>
                ) : null}
              </div>
            ) : (
              <>
                {hasPreview ? (
              <div>
                <div className="mt-10 mb-10 text-center">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-orange-600">DIYアイデア</h2>
                  <div className="mt-3 h-1.5 w-32 mx-auto rounded bg-orange-300"></div>
                </div>
                {/* 一覧: タイトル + 3Dモデル(縦長) + 必要材料を大きく */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch">
                  {result.ideas.map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`text-left p-3 rounded transition-colors border ${selectedIndex===idx? 'border-blue-400' : 'border-transparent hover:border-blue-400'} flex flex-col h-[30rem]`}
                    >
                      <div className="relative pt-7 h-full">
                        {/* 吊りひも（画鋲＋ひも） */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-700 rounded-full shadow" />
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-orange-300 rotate-[-20deg] rounded" style={{transformOrigin:'left center'}} />
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-orange-300 rotate-[20deg] rounded" style={{transformOrigin:'right center'}} />

                        {/* 額縁 */}
                        <div className="flex flex-col h-full rounded-lg border-4 border-amber-700 bg-amber-50 shadow-md p-3">
                          <div className="mb-2 min-h-[3.5rem] text-center">
                            <h4 className="text-xl font-extrabold mb-1 line-clamp-2">{idea.title}</h4>
                            <div className="text-sm">
                              {Array.from({length:5}).map((_,i)=>(<Star key={i} filled={i < getStarCount(idea.difficulty)} />))}
                            </div>
                          </div>
                          {/* 3Dプレビュー */}
                          <div className="w-full h-72 rounded-md overflow-hidden bg-white mb-4 grid place-items-center">
                            {hasPreview ? (
                              <img src={result.model!.preview_image_url as string} alt="3D preview" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <OBJViewer src="/mock3d/" className="w-full h-full" wireColor="#444" bgColor="transparent" />
                            )}
                          </div>
                          {/* 材料 */}
                          {idea.materials?.length ? (
                            <div className="mt-auto">
                              <div className="font-semibold mb-2 h-6">必要な材料</div>
                              <ul className="flex flex-wrap gap-2">
                                {idea.materials.slice(0,6).map((m, i) => (
                                  <li key={i} className="px-3 py-1 rounded-full bg-white border border-amber-300 text-sm whitespace-nowrap">{m}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="mt-auto">
                              <div className="font-semibold mb-2 h-6">必要な材料</div>
                              <div className="min-h-[56px]" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* DIY アイデア（3D未生成時: 各カードにモック） */}
                <div className="mt-10 mb-10 text-center">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-orange-600">DIYアイデア</h2>
                  <div className="mt-3 h-1.5 w-32 mx-auto rounded bg-orange-300"></div>
                </div>
                {/* 一覧: タイトル + 3Dモデル(縦長モック) + 必要材料を大きく */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch">
                  {result.ideas.map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`text-left p-3 rounded transition-colors border ${selectedIndex===idx? 'border-blue-400' : 'border-transparent hover:border-blue-400'} flex flex-col h-[30rem]`}
                    >
                      <div className="relative pt-7 h-full">
                        {/* 吊りひも（画鋲＋ひも） */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-700 rounded-full shadow" />
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-orange-300 rotate-[-20deg] rounded" style={{transformOrigin:'left center'}} />
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-orange-300 rotate-[20deg] rounded" style={{transformOrigin:'right center'}} />

                        {/* 額縁 */}
                        <div className="flex flex-col h-full rounded-lg border-4 border-amber-700 bg-amber-50 shadow-md p-3">
                          <div className="mb-2 min-h-[3.5rem] text-center">
                            <h4 className="text-xl font-extrabold mb-1 line-clamp-2">{idea.title}</h4>
                            <div className="text-sm">
                              {Array.from({length:5}).map((_,i)=>(<Star key={i} filled={i < getStarCount(idea.difficulty)} />))}
                            </div>
                          </div>
                          {/* 3Dプレビュー（モック） */}
                          <div className="w-full h-72 rounded-md overflow-hidden bg-white mb-4 grid place-items-center">
                            <OBJViewer src="/mock3d/mock.obj" className="w-full h-full" wireColor="#444" bgColor="transparent" />
                          </div>
                          {/* 材料 */}
                          {idea.materials?.length ? (
                            <div className="mt-auto">
                              <div className="font-semibold mb-2 h-6">必要な材料</div>
                              <ul className="flex flex-wrap gap-2">
                                {idea.materials.slice(0,6).map((m, i) => (
                                  <li key={i} className="px-3 py-1 rounded-full bg-white border border-amber-300 text-sm whitespace-nowrap">{m}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="mt-auto">
                              <div className="font-semibold mb-2 h-6">必要な材料</div>
                              <div className="min-h-[56px]" />
                            </div>
                          )}
                        </div>
                      </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10 place-items-center">
              {images.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Captured ${index + 1}`}
                  className="w-40 h-40 md:w-56 md:h-56 object-contain rounded-lg shadow"
                />
              ))}
            </div>
            <div className="w-full max-w-3xl mx-auto text-left mb-6">
              <label className="block text-2xl md:text-3xl font-extrabold mb-3">説明（材質・状態・数など）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full min-h-[180px] p-4 rounded-xl bg-white border border-gray-300 text-lg md:text-xl"
              />
              <label className="mt-4 inline-flex items-center gap-3 text-lg md:text-xl font-bold">
                <input type="checkbox" checked={generateModel} onChange={(e) => setGenerateModel(e.target.checked)} className="w-5 h-5" />
                完成3Dイメージを作成する
              </label>
            </div>
            <button
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-6 rounded w-72 text-lg"
            >
              DIYアイデアを生成
            </button>
            {errorMessage && (
              <div className="mt-4 text-red-400 text-sm">{errorMessage}</div>
            )}
          </div>
        )}
        
      </div>
      {/* ガイドモード（フルスクリーン） */}
      {guideOpen && selectedIndex !== null && result?.ideas[selectedIndex]?.steps?.length ? (
        <div className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center">
          <div className="relative w-[98vw] h-[90vh] max-w-none bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              {!guideCompleted ? (
                <h3 className="text-xl md:text-2xl font-extrabold">{result.ideas[selectedIndex].title}</h3>
              ) : (
                <div className="text-sm text-neutral-600">ガイド完了</div>
              )}
              <button className="text-sm px-3 py-1 rounded bg-neutral-100 border border-neutral-300" onClick={() => { setGuideOpen(false); setGuideCompleted(false); }}>閉じる</button>
            </div>

            {!guideCompleted ? (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0 h-full">
                {/* 大きな3D/プレビュー領域（左：3/5） */}
                <div className="lg:col-span-3 p-4 md:p-6 bg-neutral-50 border-r border-neutral-200 flex items-center justify-center">
                  <div className="w-full h-full min-h-[60vh] rounded-lg overflow-hidden bg-white">
                    {hasPreview ? (
                      <img src={result.model!.preview_image_url as string} alt="3Dプレビュー" className="w-full h-full object-contain" />
                    ) : hasObjModel ? (
                      <OBJViewer src={modelUrl as string} className="w-full h-full" wireColor="#444" bgColor="transparent" />
                    ) : (
                      <OBJViewer src="/mock3d/mock.obj" className="w-full h-full" wireColor="#444" bgColor="transparent" />
                    )}
                  </div>
                </div>
                {/* 右：手順テキスト（2/5） - ボタン位置安定化 */}
                <div className="lg:col-span-2 p-6 md:p-10 flex flex-col">
                  {/* スクロール領域 */}
                  <div className="flex-1 overflow-auto flex">
                  <div className="mx-auto my-auto w-full max-w-3xl text-center py-8 md:py-10">
                    {/* ステップ番号（本文の上） */}
                    {stepIndex >= 0 ? (
                      <div className="mb-6 md:mb-8">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500 text-white text-xl md:text-2xl font-extrabold tracking-wide">STEP {stepIndex+1}</span>
                        <span className="ml-3 align-middle text-lg md:text-xl text-neutral-700 font-extrabold">/ {result.ideas[selectedIndex].steps.length}</span>
                      </div>
                    ) : (
                      <div className="mb-6 md:mb-8">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-neutral-900 text-white text-xl md:text-2xl font-extrabold tracking-wide">準備</span>
                      </div>
                    )}
                    {/* 本文 */}
                    {stepIndex >= 0 ? (
                      <>
                        <div className="text-2xl md:text-3xl font-extrabold mt-2 mb-6 whitespace-pre-wrap leading-[2rem] md:leading-[2.2rem]">
                          {getStepText(result.ideas[selectedIndex].steps[stepIndex])}
                        </div>
                        {/* 操作イメージ */}
                        {getOpImage(getStepOp(result.ideas[selectedIndex].steps[stepIndex])) ? (
                          <div className="mb-6 flex justify-center">
                            <img
                              src={getOpImage(getStepOp(result.ideas[selectedIndex].steps[stepIndex]))}
                              alt={getStepOp(result.ideas[selectedIndex].steps[stepIndex]) || 'operation'}
                              className="w-32 h-32 md:w-40 md:h-40 object-contain bg-white/70 rounded-lg"
                            />
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="text-neutral-900">
                        <div className="text-3xl md:text-4xl font-extrabold">はじめましょう</div>
                        <div className="mt-4 text-lg md:text-xl font-bold text-neutral-600">画面の案内にそって、一歩ずつ進めます。</div>
                      </div>
                    )}
                    </div>
                  </div>
                  {/* ボタン固定域 */}
                  <div className="pt-4 md:pt-6 pb-2 flex justify-center border-t border-neutral-200/60">
                    <button
                      className="px-8 py-4 rounded-lg bg-emerald-600 text-white text-lg shadow"
                      onClick={() => {
                        if (stepIndex < 0) {
                          setStepIndex(0);
                          return;
                        }
                        if (stepIndex >= result.ideas![selectedIndex].steps.length - 1) {
                          setGuideCompleted(true);
                        } else {
                          setStepIndex(stepIndex + 1);
                        }
                      }}
                    >
                      {stepIndex < 0 ? 'はじめる' : 'できました'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 relative p-8">
                {/* 背景に3Dモデル（またはプレビュー） */}
                <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                  {hasPreview ? (
                    <img src={result.model!.preview_image_url as string} alt="3Dプレビュー" className="max-w-full max-h-full object-contain opacity-60" />
                  ) : hasObjModel ? (
                    <div className="absolute inset-0 opacity-70">
                      <OBJViewer src={modelUrl as string} className="w-full h-full" wireColor="#444" bgColor="transparent" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 opacity-70">
                      <OBJViewer src="/mock3d/mock.obj" className="w-full h-full" wireColor="#444" bgColor="transparent" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-white/30" />
                </div>

                <div className="relative z-10 w-full h-full grid place-items-center">
                  <div className="text-center font-extrabold text-emerald-600">
                    <div className="text-5xl md:text-6xl">完成！</div>
                    <div className="text-4xl md:text-5xl mt-2">よくできました！</div>
                  </div>
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      className="px-6 py-3 rounded bg-neutral-900 text-white"
                      onClick={() => { setGuideOpen(false); setGuideCompleted(false); }}
                    >
                      閉じる
                    </button>
                    <button
                      className="px-6 py-3 rounded bg-blue-600 text-white"
                      onClick={() => { setGuideCompleted(false); setStepIndex(-1); }}
                    >
                      もう一度みる
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!guideCompleted && (
              <div className="px-5 py-4 border-t border-neutral-200 flex items-center justify-between">
                <button
                  className="px-4 py-2 rounded bg-neutral-100 border border-neutral-300 disabled:opacity-40"
                  onClick={() => setStepIndex(i => Math.max(-1, i-1))}
                  disabled={stepIndex === -1}
                >
                  前へ
                </button>
                <div className="flex-1 mx-4 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-900" style={{width: `${((stepIndex+1)/result.ideas[selectedIndex].steps.length)*100}%`}} />
                </div>
                <div className="w-[96px]" />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* フリップブックは取り消し（元のフローに戻しました） */
