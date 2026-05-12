import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useGameStore from './store/gameStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Squad from './pages/Squad';
import Tactics from './pages/Tactics';
import Match from './pages/Match';
import Transfers from './pages/Transfers';
import Results from './pages/Results';

function ProtectedRoute({ children }) {
  const myClub = useGameStore(s => s.myClub);
  if (!myClub) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/squad" element={<Squad />} />
                  <Route path="/tactics" element={<Tactics />} />
                  <Route path="/match" element={<Match />} />
                  <Route path="/transfers" element={<Transfers />} />
                  <Route path="/results" element={<Results />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}