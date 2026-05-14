import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ParkingSquare, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [loginError, setLoginError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const validate = () => {
    const newErrors = {};
    const emailValue = form.email.trim();
    
    if (!emailValue) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      newErrors.email = 'El formato del correo no es válido';
    }
    
    if (!form.password) {
      newErrors.password = 'La contraseña es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setLoginError('');
    if (!validate()) return;
    
    setLoading(true);
    try {
      const email = form.email.trim();
      const user = await login(email, form.password);
      
      toast.success(`¡Bienvenido, ${user.nombre.split(' ')[0]}!`);
      
      if (user.rol === 'admin') navigate('/dashboard');
      else navigate('/ingreso');
      
    } catch (err) {
      const msg = err?.message || err?.response?.data?.error || 'Error al iniciar sesión, intente de nuevo';
      setLoginError(msg);
      toast.error(msg);
    } finally {

      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><ParkingSquare size={26} color="#fff" /></div>
          <div>
            <div className="login-title">ParkingTech</div>
            <div className="login-subtitle">Gestión Inteligente de Parqueadero</div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Iniciar Sesión</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          Ingresa tus credenciales de Supabase Auth
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'border-red' : ''}`}
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'border-red' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: 4,
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="spinner-small" /> Autenticando...
              </div>
            ) : (
              <><LogIn size={18} /> Entrar al Sistema</>
            )}
          </button>

          {loginError && (
            <div className="alert alert-error" style={{ 
              marginTop: 20, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              justifyContent: 'center',
              animation: 'fadeIn 0.3s ease'
            }}>
              <AlertCircle size={14} />
              {loginError}
            </div>
          )}
        </form>

        <div style={{
          marginTop: 24, padding: 14,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Aviso de Seguridad:</strong><br />
          Tu sesión es gestionada por Supabase Auth. Asegúrate de cerrar sesión al terminar.
        </div>
      </div>
    </div>
  );
};

export default Login;
