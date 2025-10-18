import { Route, Routes } from 'react-router-dom';
import Home from './src/components/Home/index';

export default function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home />} />
      </Routes>
    </div>
  )
}
