import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, LogIn, LogOut, Users,
  DollarSign, BarChart3, Settings, ParkingSquare, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
  >
    <Icon size={17} className="icon" />
    <span>{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setShowConfirm(false);
    await logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const initials = user?.nombre
    ?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ParkingSquare size={22} color="#fff" />
        </div>
        <div className="sidebar-logo-title">ParkingTech</div>
        <div className="sidebar-logo-sub">S.A.S — Gestión Inteligente</div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Principal</div>
        <NavItem to="/dashboard"  icon={LayoutDashboard} label="Dashboard"   />
        <NavItem to="/ingreso"    icon={LogIn}            label="Ingreso"     />
        <NavItem to="/salida"     icon={LogOut}           label="Salida"      />
        <NavItem to="/vehiculos"  icon={Car}              label="Vehículos"   />

        {isAdmin && (
          <>
            <div className="sidebar-section-label">Administración</div>
            <NavItem to="/tarifas"  icon={DollarSign}   label="Tarifas"   />
            <NavItem to="/usuarios" icon={Users}         label="Usuarios"  />
            <NavItem to="/reportes" icon={BarChart3}     label="Reportes"  />
          </>
        )}
      </nav>

      {/* Footer usuario */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.nombre?.split(' ')[0]}</div>
            <div className="sidebar-user-role">{user?.rol}</div>
          </div>
          <button
            className="logout-btn"
            onClick={() => setShowConfirm(true)}
            title="Cerrar sesión"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Modal de confirmación de logout */}
      {showConfirm && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center', padding: '30px 24px' }}>
            <div style={{ 
              width: 56, height: 56, background: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 16px' 
            }}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <h3 style={{ marginBottom: 8, fontSize: 18 }}>¿Cerrar Sesión?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              ¿Estás seguro de que deseas salir del sistema? Tendrás que ingresar tus credenciales de nuevo.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-danger" onClick={handleLogout} style={{ flex: 1, justifyContent: 'center' }}>
                <LogOut size={16} /> Sí, Salir
              </button>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
