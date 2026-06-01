import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Rooms from './pages/Rooms';
import CommonAreas from './pages/CommonAreas';
import Issues from './pages/Issues';
import OtherTasks from './pages/OtherTasks';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-700">
        <div className="text-white text-lg">Ładowanie...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/rooms" replace />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/common-areas" element={<CommonAreas />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/tasks" element={<OtherTasks />} />
        <Route path="*" element={<Navigate to="/rooms" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
