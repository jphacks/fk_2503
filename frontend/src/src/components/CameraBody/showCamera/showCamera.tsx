import { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export default function ShowCamera() {
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    const count = parseInt(localStorage.getItem("imageCount") || "0", 10);
    setImageCount(count);
  }, []);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const newCount = imageCount + 1;
      localStorage.setItem(`capturedImage_${newCount}`, imageSrc);
      localStorage.setItem("imageCount", newCount.toString());
      setImageCount(newCount);
      navigate("/confirmation");
    }
  }, [webcamRef, navigate, imageCount]);

  return (
    <div className="relative flex-grow">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 w-full flex justify-center p-4">
        {imageCount < 5 && (
          <button
            onClick={capture}
            className="bg-white border-4 border-gray-500 rounded-full w-20 h-20"
          />
        )}
      </div>
    </div>
  );
}


