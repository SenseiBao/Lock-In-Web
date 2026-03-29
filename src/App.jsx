import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainGame from './pages/MainGame';
import DescriberPage from './pages/DescriberPage';
import GuesserPage from './pages/GuesserPage';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainGame />} />
                <Route path="/describe/:roomCode" element={<DescriberPage />} />
                <Route path="/join/:roomCode" element={<GuesserPage />} />
            </Routes>
        </BrowserRouter>
    );
}
