import SwipeableViews from 'react-swipeable-views';
import { autoPlay } from 'react-swipeable-views-utils';
import Slide1 from './SlideTutorial/TutorialDetails1';
import Slide2 from './SlideTutorial/TutorialDetails2';
import Slide3 from './SlideTutorial/TutorialDetails3';
import Slide4 from './SlideTutorial/TutorialDetails4';

const EnhancedSwipeableViews = autoPlay(SwipeableViews);

export default function SlideShow() {
  return (
    <EnhancedSwipeableViews enableMouseEvents interval={2000}> 
      <Slide1 />
      <Slide2 />
      <Slide3 />
      <Slide4 />
    </EnhancedSwipeableViews>
  );
}
