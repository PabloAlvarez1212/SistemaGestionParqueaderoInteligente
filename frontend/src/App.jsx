import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

import Login    from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ingreso  from './pages/Ingreso';
import Salida   from './pages/Salida';
import Vehiculos from './pages/Vehiculos';
import Tarifas  from './pages/Tarifas';
import Usuarios from './pages/Usuarios';
import Reportes from './pages/Reportes';

// ── Rutas protegidas ──────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />;
  if (!user)    return <Navigate to="/login"     replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// ── App ───────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Pública */}
    <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />

    {/* Privadas */}
    <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
    <Route path="/ingreso"   element={<PrivateRoute><Layout><Ingreso   /></Layout></PrivateRoute>} />
    <Route path="/salida"    element={<PrivateRoute><Layout><Salida    /></Layout></PrivateRoute>} />
    <Route path="/vehiculos" element={<PrivateRoute><Layout><Vehiculos /></Layout></PrivateRoute>} />

    {/* Solo Admin */}
    <Route path="/tarifas"  element={<AdminRoute><Layout><Tarifas  /></Layout></AdminRoute>} />
    <Route path="/usuarios" element={<AdminRoute><Layout><Usuarios /></Layout></AdminRoute>} />
    <Route path="/reportes" element={<AdminRoute><Layout><Reportes /></Layout></AdminRoute>} />

    {/* Redirección raíz */}
    <Route path="/"   element={<Navigate to="/dashboard" replace />} />
    <Route path="*"   element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color:      '#f1f5f9',
            border:     '1px solid #1e2d45',
            fontSize:   14,
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
