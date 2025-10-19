import { useRef, useState } from 'react';
import Slide1 from './SlideTutorial/TutorialDetails1';
import Slide2 from './SlideTutorial/TutorialDetails2';
import Slide3 from './SlideTutorial/TutorialDetails3';
import Slide4 from './SlideTutorial/TutorialDetails4';
import nextButton from "../../../../assets/img/nextPageButton.png"
import backButton from "../../../../assets/img/backPageButton.png"

const slides = [<Slide1 />, <Slide2 />, <Slide3 />, <Slide4 />];

export default function SlideShow() {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

  const handleChangeIndex = (i: number) => setIndex(i);

  const handleNext = () => {
    setIndex((prevIndex) => Math.min(prevIndex + 1, slides.length - 1));
  };

  const handleBack = () => {
    setIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Simple touch swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    setTouchDeltaX(e.touches[0].clientX - touchStartX);
  };
  const onTouchEnd = () => {
    const threshold = 50; // px
    if (touchDeltaX > threshold) {
      handleBack();
    } else if (touchDeltaX < -threshold) {
      handleNext();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  return (
    <div className="relative w-full mb-20 select-none">
      <div
        ref={containerRef}
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="min-w-full shrink-0">
              {slide}
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleBack} disabled={index === 0} className="absolute top-1/2 left-2 -translate-y-1/2 p-2">
        <img src={backButton} alt="スライドボタン" className='w-10 h-10' />
      </button>
      <button onClick={handleNext} disabled={index === slides.length - 1} className="absolute top-1/2 right-2 -translate-y-1/2 p-2">
        <img src={nextButton} alt="スライドボタン" className='w-11 h-10' />
      </button>
    </div>
  );
}
