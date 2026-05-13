import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useGameStore from './store/gameStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Club from './pages/Club';
import Matchday from './pages/Matchday';
import Competitions from './pages/Competitions';
import Manager from './pages/Manager';

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
                  <Route path="/home" element={<Dashboard />} />
                  <Route path="/club" element={<Club />} />
                  <Route path="/matchday" element={<Matchday />} />
                  <Route path="/competitions" element={<Competitions />} />
                  <Route path="/manager" element={<Manager />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}