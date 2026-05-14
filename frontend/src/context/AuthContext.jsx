import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cargar sesión inicial
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.access_token); // Usamos ID (UUID)
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Escuchar cambios en la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event);
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.access_token);
      } else {
        setUser(null);
        localStorage.removeItem('parking_token');
        localStorage.removeItem('parking_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId, accessToken) => {
    try {
      const { data } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUser(data);
      localStorage.setItem('parking_user', JSON.stringify(data));
      localStorage.setItem('parking_token', accessToken);
    } catch (err) {
      console.error('Error al obtener perfil:', err.message);
    } finally {
      setLoading(false);
    }
  };


const login = async (email, password) => {
  // Autenticación oficial contra auth.users
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mapeo de errores de Supabase Auth
    if (error.message === 'Invalid login credentials') {
      throw new Error('Contraseña incorrecta o usuario no encontrado');
    }
    throw error;
  }

  // El perfil se cargará automáticamente vía onAuthStateChange, 
  // pero podemos forzar el retorno aquí para el login directo si es necesario
  const { data: profile } = await supabase
    .from('usuarios')
    .select('id, nombre, email, roles(nombre)')
    .eq('id', data.user.id)
    .single();

  const userData = { ...profile, rol: profile.roles.nombre };
  return userData;
};

const logout = async () => {
  await supabase.auth.signOut();
  setUser(null);
  localStorage.removeItem('parking_token');
  localStorage.removeItem('parking_user');
};

const isAdmin = user?.rol === 'admin';
const isEmpleado = ['admin', 'empleado'].includes(user?.rol);

return (
  <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isEmpleado }}>
    {children}
  </AuthContext.Provider>
);
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
