import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutGroup } from 'framer-motion';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import SearchPage from './pages/Search';
import LibraryPage from './pages/Library';
import PlaylistDetail from './pages/PlaylistDetail';
import QueuePage from './pages/Queue';
import NowPlayingPage from './pages/NowPlaying';
import LyricsPage from './pages/Lyrics';
import ImportPage from './pages/Import';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <LayoutGroup>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"        element={<HomePage />} />
          <Route path="/search"  element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:id" element={<PlaylistDetail />} />
          <Route path="/import"  element={<ImportPage />} />
          <Route path="/queue"   element={<QueuePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        {/* Full-screen overlays (no tab bar) */}
        <Route path="/now-playing" element={<NowPlayingPage />} />
        <Route path="/lyrics"      element={<LyricsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </LayoutGroup>
    </BrowserRouter>
  );
}
