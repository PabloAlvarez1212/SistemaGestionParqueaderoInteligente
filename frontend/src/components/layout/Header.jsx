import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/dashboard':  { title: 'Dashboard',           sub: 'Resumen en tiempo real' },
  '/ingreso':    { title: 'Registro de Ingreso',  sub: 'Registrar entrada de vehículo' },
  '/salida':     { title: 'Registro de Salida',   sub: 'Cobro y salida de vehículo' },
  '/vehiculos':  { title: 'Vehículos',            sub: 'Historial y vehículos activos' },
  '/tarifas':    { title: 'Configuración de Tarifas', sub: 'Gestión de tarifas y descuentos' },
  '/usuarios':   { title: 'Gestión de Usuarios',  sub: 'Empleados y administradores' },
  '/reportes':   { title: 'Reportes',             sub: 'Análisis e informes del sistema' },
};

const Header = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark');
  const info = TITLES[pathname] || { title: 'ParkingTech', sub: '' };
  const now  = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    const storedTheme = localStorage.getItem('parking-theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.dataset.theme = storedTheme;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('parking-theme', nextTheme);
  };

  return (
    <header className="header">
      <div>
        <h1 className="header-title">{info.title}</h1>
        {info.sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{info.sub}</p>}
      </div>
      <div className="header-actions">
        <button type="button" className="theme-toggle-btn btn-secondary btn-sm" onClick={toggleTheme}>
          {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
        
        <div className="header-divider" />

        <div className="header-user-info">
          <div className="header-user-name">{user?.nombre}</div>
          <div className="header-date">{now}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
