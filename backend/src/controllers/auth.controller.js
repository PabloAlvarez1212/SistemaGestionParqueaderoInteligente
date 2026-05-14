const supabase = require('../config/supabase');

const me = async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, activo, roles(nombre)')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ ...profile, rol: profile.roles.nombre });
  } catch (err) {
    console.error('Error en /me:', err);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

module.exports = {
  me
};
