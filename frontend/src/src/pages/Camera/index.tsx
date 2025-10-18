import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import Header from "../../components/Header";
import backButton from "../../../assets/img/backPage.png";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export default function CameraScreen() {
  const webcamRef = useRef<Webcam>(null);
  const [url, setUrl] = useState<string | null>(null);
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setUrl(imageSrc);
    }
  }, [webcamRef]);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header title={<img src={backButton} alt="Back" className="ml-2 w-5 h-8" />} />
      {url ? (
        <div className="relative flex-grow">
          <img src={url} alt="Screenshot" className="w-full h-full object-contain" />
          <div className="absolute bottom-0 w-full flex justify-center p-4">
            <button
              onClick={() => setUrl(null)}
              className="bg-white text-black rounded-full w-16 h-16 flex items-center justify-center font-bold"
            >
              削除
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex-grow">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 w-full flex justify-center p-4">
            <button
              onClick={capture}
              className="bg-white border-4 border-gray-500 rounded-full w-20 h-20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
