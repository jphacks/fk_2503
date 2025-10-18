import { Route, Routes } from 'react-router-dom';
import Home from './src/pages/Home';
import CameraScreen from './src/pages/Camera';

export default function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/camera' element={<CameraScreen />} />
      </Routes>
    </div>
  )
}
