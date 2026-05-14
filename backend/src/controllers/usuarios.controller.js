const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');

// ── Validaciones DTO ──────────────────────────────────────────
const crearUsuarioValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('email').isEmail().withMessage('Email inválido.'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('rol_id').isInt({ min: 1 }).withMessage('rol_id debe ser un número entero válido.'),
];

const actualizarUsuarioValidators = [
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('email').optional().isEmail().withMessage('Email inválido.'),
  body('rol_id').optional().isInt({ min: 1 }).withMessage('rol_id debe ser válido.'),
];

// ── GET /api/usuarios ─────────────────────────────────────────
const listarUsuarios = async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email, activo, created_at, roles(id, nombre)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ usuarios: data });
};

// ── GET /api/usuarios/:id ─────────────────────────────────────
const obtenerUsuario = async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email, activo, created_at, roles(id, nombre)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado.' });
  return res.json({ usuario: data });
};

// ── POST /api/usuarios (Crear en Auth + Perfil Manual) ──────────
const crearUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { nombre, email, password, rol_id } = req.body;

  try {
    // 1. Crear en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { nombre },
      email_confirm: true
    });

    if (authError) return res.status(400).json({ error: authError.message });

    // 2. Insertar en public.usuarios con el mismo UUID
    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nombre,
        email,
        rol_id,
        activo: true
      })
      .select('id, nombre, email, activo, roles(nombre)')
      .single();

    if (dbError) {
      // Si falla, eliminar el usuario de auth para no dejar inconsistencias
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: dbError.message });
    }

    return res.status(201).json({ ...usuario, rol: usuario.roles.nombre });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno al procesar el registro.' });
  }
};


// ── PUT /api/usuarios/:id ─────────────────────────────────────
const actualizarUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { nombre, email, rol_id, activo } = req.body;
  const updates = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (email !== undefined)  updates.email  = email;
  if (rol_id !== undefined) updates.rol_id = rol_id;
  if (activo !== undefined) updates.activo = activo;
  updates.updated_at = new Date().toISOString();

  try {
    // 1. Si el email cambió, actualizarlo en Supabase Auth
    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(req.params.id, { email });
      if (authError) return res.status(400).json({ error: `Error actualizando email en Auth: ${authError.message}` });
    }

    // 2. Actualizar tabla perfiles
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, nombre, email, activo, roles(nombre)')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Usuario actualizado correctamente.', usuario: data });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno al actualizar.' });
  }
};

// ── DELETE /api/usuarios/:id ──────────────────────────────────
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Eliminar de Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) return res.status(400).json({ error: authError.message });

    // 2. Eliminar de public.usuarios
    const { error: dbError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (dbError) return res.status(500).json({ error: dbError.message });

    return res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
};


// ── PUT /api/usuarios/:id/password ────────────────────────────
const cambiarPassword = async (req, res) => {
  const { password_nuevo } = req.body;
  if (!password_nuevo || password_nuevo.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const { error } = await supabase.auth.admin.updateUserById(req.params.id, { 
      password: password_nuevo 
    });

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Contraseña actualizada en Supabase Auth correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar contraseña.' });
  }
};

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  cambiarPassword,
  crearUsuarioValidators,
  actualizarUsuarioValidators,
};
