import { Route, Routes } from 'react-router-dom';
import Home from './src/pages/Home';
import CameraScreen from './src/pages/Camera';
import PhotoConfirmation from './src/pages/PhotoConfirmation';
import AIGeneration from './src/pages/AIGeneration';

export default function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/camera' element={<CameraScreen />} />
        <Route path='/confirmation' element={<PhotoConfirmation />} />
        <Route path='/ai-generation' element={<AIGeneration />} />
      </Routes>
    </div>
  )
}
