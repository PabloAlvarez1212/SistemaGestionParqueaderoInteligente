const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');

// ── Validaciones DTO ──────────────────────────────────────────
const actualizarTarifaValidators = [
  body('tarifa_hora').optional().isFloat({ min: 0 }).withMessage('tarifa_hora debe ser un número positivo.'),
  body('tarifa_minuto').optional().isFloat({ min: 0 }).withMessage('tarifa_minuto debe ser un número positivo.'),
  body('descuento_porcentaje').optional().isFloat({ min: 0, max: 100 }).withMessage('Descuento debe estar entre 0 y 100.'),
  body('tarifa_especial_fija').optional().isFloat({ min: 0 }).withMessage('tarifa_especial_fija debe ser positivo.'),
  body('tiempo_gracia_minutos').optional().isInt({ min: 0 }).withMessage('tiempo_gracia_minutos debe ser entero positivo.'),
];

// ── GET /api/tarifas ──────────────────────────────────────────
const listarTarifas = async (req, res) => {
  const { data, error } = await supabase
    .from('tarifas')
    .select(`
      id, tarifa_hora, tarifa_minuto, descuento_porcentaje,
      tarifa_especial_fija, hora_inicio_especial, hora_fin_especial,
      tiempo_gracia_minutos, activo, updated_at,
      tipos_vehiculo(id, nombre),
      tipos_usuario(id, nombre)
    `)
    .order('id');

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ tarifas: data });
};

// ── GET /api/tarifas/:id ──────────────────────────────────────
const obtenerTarifa = async (req, res) => {
  const { data, error } = await supabase
    .from('tarifas')
    .select(`
      id, tarifa_hora, tarifa_minuto, descuento_porcentaje,
      tarifa_especial_fija, hora_inicio_especial, hora_fin_especial,
      tiempo_gracia_minutos, activo,
      tipos_vehiculo(id, nombre),
      tipos_usuario(id, nombre)
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Tarifa no encontrada.' });
  return res.json({ tarifa: data });
};

// ── PUT /api/tarifas/:id ──────────────────────────────────────
const actualizarTarifa = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const campos = [
    'tarifa_hora', 'tarifa_minuto', 'descuento_porcentaje',
    'tarifa_especial_fija', 'hora_inicio_especial', 'hora_fin_especial',
    'tiempo_gracia_minutos', 'activo',
  ];
  const updates = {};
  campos.forEach((c) => { if (req.body[c] !== undefined) updates[c] = req.body[c]; });
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('tarifas')
    .update(updates)
    .eq('id', req.params.id)
    .select('id, tarifa_hora, tarifa_minuto, descuento_porcentaje, tarifa_especial_fija, hora_inicio_especial, hora_fin_especial, tiempo_gracia_minutos')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Tarifa no encontrada.' });
  return res.json({ message: 'Tarifa actualizada.', tarifa: data });
};

// ── GET /api/tipos-vehiculo ───────────────────────────────────
const listarTiposVehiculo = async (req, res) => {
  const { data, error } = await supabase
    .from('tipos_vehiculo')
    .select('id, nombre, descripcion')
    .order('id');
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ tipos_vehiculo: data });
};

// ── GET /api/tipos-usuario ────────────────────────────────────
const listarTiposUsuario = async (req, res) => {
  const { data, error } = await supabase
    .from('tipos_usuario')
    .select('id, nombre, descripcion')
    .order('id');
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ tipos_usuario: data });
};

// ── GET /api/metodos-pago ─────────────────────────────────────
const listarMetodosPago = async (req, res) => {
  const { data, error } = await supabase
    .from('metodos_pago')
    .select('id, nombre')
    .eq('activo', true)
    .order('id');
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ metodos_pago: data });
};

// ── GET /api/roles ────────────────────────────────────────────
const listarRoles = async (req, res) => {
  const { data, error } = await supabase
    .from('roles')
    .select('id, nombre, descripcion')
    .order('id');
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ roles: data });
};

module.exports = {
  listarTarifas,
  obtenerTarifa,
  actualizarTarifa,
  listarTiposVehiculo,
  listarTiposUsuario,
  listarMetodosPago,
  listarRoles,
  actualizarTarifaValidators,
};
