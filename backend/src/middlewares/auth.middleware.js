const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });

    // Obtener perfil completo con rol
    const { data: profile } = await supabase
      .from('usuarios')
      .select('id, nombre, email, activo, roles(nombre)')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.activo) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    req.user = { ...profile, rol: profile.roles.nombre };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Error de autenticación' });
  }
};

module.exports = authMiddleware;
