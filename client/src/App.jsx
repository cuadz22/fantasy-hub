import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import League from './pages/League';
import Studio from './pages/Studio';
import Nav from './components/Nav';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/league/:id" element={<League />} />
        <Route path="/studio" element={<Studio />} />
      </Routes>
    </BrowserRouter>
  );
}
