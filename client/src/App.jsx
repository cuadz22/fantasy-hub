import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import League from './pages/League';
import Studio from './pages/Studio';
import Connect from './pages/Connect';
import Nav from './components/Nav';
import useTheme from './hooks/useTheme';

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <BrowserRouter>
      <Nav theme={theme} onToggleTheme={toggle} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/league/:id" element={<League />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/connect" element={<Connect />} />
      </Routes>
    </BrowserRouter>
  );
}
