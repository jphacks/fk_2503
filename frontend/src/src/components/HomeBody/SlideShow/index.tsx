import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Slide1 from './SlideTutorial/TutorialDetails1';
import Slide2 from './SlideTutorial/TutorialDetails2';
import Slide3 from './SlideTutorial/TutorialDetails3';
import Slide4 from './SlideTutorial/TutorialDetails4';
import nextButton from "../../../../assets/img/nextPageButton.png"
import backButton from "../../../../assets/img/backPageButton.png"

const slides = [<Slide1 />, <Slide2 />, <Slide3 />, <Slide4 />];

export default function SlideShow() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const handleNext = () => emblaApi?.scrollNext();
  const handleBack = () => emblaApi?.scrollPrev();

  return (
    <div className="relative w-full mb-20">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0">
              {slide}
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleBack} disabled={!canPrev || selectedIndex === 0} className="absolute top-1/2 left-8 -translate-y-1/2 p-2 disabled:opacity-50">
        <img src={backButton} alt="スライドボタン" className='w-10 h-10' />
      </button>
      <button onClick={handleNext} disabled={!canNext || selectedIndex === slides.length - 1} className="absolute top-1/2 right-8 -translate-y-1/2 p-2 disabled:opacity-50">
        <img src={nextButton} alt="スライドボタン" className='w-11 h-10' />
      </button>
    </div>
  );
}
