import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { RequirePermiso } from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ModuloPendiente from './pages/ModuloPendiente';
import Usuarios from './pages/usuarios/Usuarios';
import Notificaciones from './pages/notificaciones/Notificaciones';
import Hacienda from './pages/hacienda/Hacienda';
import Cultivos from './pages/cultivos/Cultivos';
import { MODULOS } from './config/modulos';

// Aquí se irán registrando las páginas reales de cada módulo
const PAGINAS = {
  usuarios: <Usuarios />,
  notificaciones: <Notificaciones />,
  hacienda: <Hacienda />,
  cultivos: <Cultivos />,
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              {MODULOS.filter((m) => m.clave !== 'dashboard').map((m) => (
                <Route
                  key={m.clave}
                  path={m.ruta}
                  element={
                    <RequirePermiso modulo={m.clave}>
                      {PAGINAS[m.clave] || <ModuloPendiente modulo={m} />}
                    </RequirePermiso>
                  }
                />
              ))}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}