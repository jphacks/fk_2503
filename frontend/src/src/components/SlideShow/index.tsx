import { useState } from 'react';
import SwipeableViews from 'react-swipeable-views';
import Slide1 from './SlideTutorial/TutorialDetails1';
import Slide2 from './SlideTutorial/TutorialDetails2';
import Slide3 from './SlideTutorial/TutorialDetails3';
import Slide4 from './SlideTutorial/TutorialDetails4';
import nextButton from "../../../assets/img/nextPageButton.png"
import backButton from "../../../assets/img/backPageButton.png"

const slides = [<Slide1 />, <Slide2 />, <Slide3 />, <Slide4 />];

export default function SlideShow() {
  const [index, setIndex] = useState(0);

  const handleChangeIndex = (index: number) => {
    setIndex(index);
  };

  const handleNext = () => {
    setIndex((prevIndex) => Math.min(prevIndex + 1, slides.length - 1));
  };

  const handleBack = () => {
    setIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  return (
    <div className="relative w-full">
      <SwipeableViews index={index} onChangeIndex={handleChangeIndex} enableMouseEvents>
        {slides.map((slide, i) => (
          <div key={i}>{slide}</div>
        ))}
      </SwipeableViews>
      <button onClick={handleBack} disabled={index === 0} className="absolute top-1/2 left-8 -translate-y-1/2 p-2">
        <img src={backButton} alt="スライドボタン" className='w-10 h-10' />
      </button>
      <button onClick={handleNext} disabled={index === slides.length - 1} className="absolute top-1/2 right-8 -translate-y-1/2 p-2">
        <img src={nextButton} alt="スライドボタン" className='w-11 h-10' />
      </button>
    </div>
  );
}
