const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { calcularCobro } = require('../services/cobro.service');

// ── Validaciones DTO ──────────────────────────────────────────
const ingresoValidators = [
  body('placa').trim().notEmpty().withMessage('La placa es obligatoria.')
    .toUpperCase(),
  body('tipo_vehiculo_id').isInt({ min: 1 }).withMessage('tipo_vehiculo_id inválido.'),
  body('tipo_usuario_id').isInt({ min: 1 }).withMessage('tipo_usuario_id inválido.'),
  body('propietario').optional().trim(),
];

const salidaValidators = [
  body('metodo_pago_id').isInt({ min: 1 }).withMessage('metodo_pago_id es obligatorio.'),
  body('observaciones').optional().trim(),
];

// ── POST /api/vehiculos/ingreso ───────────────────────────────
const registrarIngreso = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { placa, tipo_vehiculo_id, tipo_usuario_id, propietario } = req.body;
  const empleado_id = req.user.id;

  // Verificar si la placa ya tiene un movimiento activo
  const { data: movActivo } = await supabase
    .from('movimientos_parqueadero')
    .select('id, vehiculos(placa)')
    .eq('estado', 'activo')
    .eq('vehiculos.placa', placa)
    .maybeSingle();

  if (movActivo) {
    return res.status(409).json({ error: `El vehículo con placa ${placa} ya se encuentra en el parqueadero.` });
  }

  // Crear o recuperar vehículo por placa + tipo
  let vehiculoId;
  const { data: vehiculoExistente } = await supabase
    .from('vehiculos')
    .select('id')
    .eq('placa', placa)
    .eq('tipo_vehiculo_id', tipo_vehiculo_id)
    .eq('tipo_usuario_id', tipo_usuario_id)
    .maybeSingle();

  if (vehiculoExistente) {
    vehiculoId = vehiculoExistente.id;
  } else {
    const { data: nuevoVehiculo, error: errV } = await supabase
      .from('vehiculos')
      .insert({ placa, tipo_vehiculo_id, tipo_usuario_id, propietario })
      .select('id')
      .single();
    if (errV) return res.status(500).json({ error: errV.message });
    vehiculoId = nuevoVehiculo.id;
  }

  // Registrar movimiento de ingreso
  const { data: movimiento, error: errM } = await supabase
    .from('movimientos_parqueadero')
    .insert({
      vehiculo_id:         vehiculoId,
      empleado_ingreso_id: empleado_id,
      estado:              'activo',
    })
    .select(`
      id, hora_ingreso, estado,
      vehiculos(placa, propietario, tipos_vehiculo(nombre), tipos_usuario(nombre)),
      usuarios!movimientos_parqueadero_empleado_ingreso_id_fkey(nombre)
    `)
    .single();

  if (errM) return res.status(500).json({ error: errM.message });

  return res.status(201).json({
    message: 'Ingreso registrado exitosamente.',
    ticket: {
      movimiento_id:  movimiento.id,
      placa,
      propietario:    propietario || 'N/A',
      tipo_vehiculo:  movimiento.vehiculos.tipos_vehiculo.nombre,
      tipo_usuario:   movimiento.vehiculos.tipos_usuario.nombre,
      hora_ingreso:   movimiento.hora_ingreso,
      empleado:       movimiento.usuarios?.nombre || req.user.nombre,
    },
  });
};

// ── GET /api/vehiculos/calcular-cobro/:movimientoId ───────────
const calcularPreview = async (req, res) => {
  const { data: mov, error } = await supabase
    .from('movimientos_parqueadero')
    .select(`
      id, hora_ingreso, estado,
      vehiculos(
        placa, 
        tipo_vehiculo_id, 
        tipo_usuario_id, 
        tipos_vehiculo(nombre), 
        tipos_usuario(nombre)
      )
    `)
    .eq('id', req.params.movimientoId)
    .single();

  if (error || !mov) return res.status(404).json({ error: 'Movimiento no encontrado.' });
  if (mov.estado !== 'activo') return res.status(400).json({ error: 'Este movimiento ya fue completado.' });

  const tipoUsuarioNombre = mov.vehiculos.tipos_usuario.nombre;
  const { tipo_vehiculo_id, tipo_usuario_id } = mov.vehiculos;

  // Obtener tarifa
  const { data: tarifa } = await supabase
    .from('tarifas')
    .select('*')
    .eq('tipo_vehiculo_id', mov.vehiculos.tipo_vehiculo_id)
    .eq('tipo_usuario_id', mov.vehiculos.tipo_usuario_id)
    .single();

  const horaSalida = new Date();
  const tiempoMs = horaSalida - new Date(mov.hora_ingreso);
  const tiempoTotalMinutos = Math.max(0, Math.floor(tiempoMs / 60000));

  const cobro = tarifa
    ? calcularCobro(mov.hora_ingreso, horaSalida, tarifa, tipoUsuarioNombre)
    : { 
        tiempo_total_minutos: tiempoTotalMinutos, 
        valor_base: 0, 
        descuento_aplicado: 0, 
        valor_total: 0, 
        tipo_cobro: 'sin_tarifa', 
        detalle_cobro: 'Sin tarifa configurada' 
      };

  return res.json({
    movimiento_id: mov.id,
    placa:         mov.vehiculos.placa,
    hora_ingreso:  mov.hora_ingreso,
    hora_salida_estimada: horaSalida,
    ...cobro,
  });
};

// ── POST /api/vehiculos/salida/:movimientoId ──────────────────
const registrarSalida = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { metodo_pago_id, observaciones } = req.body;

  // Obtener movimiento activo
  const { data: mov, error } = await supabase
    .from('movimientos_parqueadero')
    .select(`
      id, hora_ingreso, estado,
      vehiculos(id, placa, propietario, tipo_vehiculo_id, tipo_usuario_id,
        tipos_vehiculo(id, nombre), tipos_usuario(id, nombre))
    `)
    .eq('id', req.params.movimientoId)
    .single();

  if (error || !mov) return res.status(404).json({ error: 'Movimiento no encontrado.' });
  if (mov.estado !== 'activo') return res.status(400).json({ error: 'Este movimiento ya fue completado.' });

  // Obtener tarifa
  const { data: tarifa } = await supabase
    .from('tarifas')
    .select('*')
    .eq('tipo_vehiculo_id', mov.vehiculos.tipo_vehiculo_id)
    .eq('tipo_usuario_id', mov.vehiculos.tipo_usuario_id)
    .single();

  const horaSalida = new Date();
  const tipoUsuarioNombre = mov.vehiculos.tipos_usuario.nombre;

  const tiempoMs = horaSalida - new Date(mov.hora_ingreso);
  const tiempoTotalMinutos = Math.max(0, Math.floor(tiempoMs / 60000));

  const cobro = tarifa
    ? calcularCobro(mov.hora_ingreso, horaSalida, tarifa, tipoUsuarioNombre)
    : { 
        tiempo_total_minutos: tiempoTotalMinutos, 
        valor_base: 0, 
        descuento_aplicado: 0, 
        valor_total: 0, 
        tipo_cobro: 'sin_tarifa', 
        detalle_cobro: 'Sin tarifa configurada' 
      };

  // Actualizar movimiento
  const { data: movActualizado, error: errU } = await supabase
    .from('movimientos_parqueadero')
    .update({
      empleado_salida_id:   req.user.id,
      hora_salida:          horaSalida.toISOString(),
      tiempo_total_minutos: cobro.tiempo_total_minutos,
      tarifa_id:            tarifa?.id || null,
      valor_base:           cobro.valor_base,
      descuento_aplicado:   cobro.descuento_aplicado,
      valor_total:          cobro.valor_total,
      metodo_pago_id,
      tipo_cobro:           cobro.tipo_cobro,
      detalle_cobro:        cobro.detalle_cobro,
      estado:               'completado',
      observaciones:        observaciones || null,
    })
    .eq('id', req.params.movimientoId)
    .select('id, hora_ingreso, hora_salida, valor_total')
    .single();

  if (errU) return res.status(500).json({ error: errU.message });

  return res.json({
    message: 'Salida registrada y cobro completado.',
    comprobante: {
      movimiento_id:        movActualizado.id,
      placa:                mov.vehiculos.placa,
      propietario:          mov.vehiculos.propietario || 'N/A',
      tipo_vehiculo:        mov.vehiculos.tipos_vehiculo.nombre,
      tipo_usuario:         tipoUsuarioNombre,
      hora_ingreso:         movActualizado.hora_ingreso,
      hora_salida:          movActualizado.hora_salida,
      tiempo_total_minutos: cobro.tiempo_total_minutos,
      valor_base:           cobro.valor_base,
      descuento_aplicado:   cobro.descuento_aplicado,
      valor_total:          cobro.valor_total,
      tipo_cobro:           cobro.tipo_cobro,
      detalle_cobro:        cobro.detalle_cobro,
    },
  });
};

// ── GET /api/vehiculos/activos ────────────────────────────────
const listarActivos = async (req, res) => {
  const { data, error } = await supabase
    .from('movimientos_parqueadero')
    .select(`
      id, hora_ingreso,
      vehiculos(placa, propietario, tipos_vehiculo(nombre), tipos_usuario(nombre)),
      usuarios!movimientos_parqueadero_empleado_ingreso_id_fkey(nombre)
    `)
    .eq('estado', 'activo')
    .order('hora_ingreso', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ vehiculos_activos: data, total: data.length });
};

// ── GET /api/vehiculos/buscar/:placa ──────────────────────────
const buscarPorPlaca = async (req, res) => {
  const placa = req.params.placa.toUpperCase();
  const { data, error } = await supabase
    .from('movimientos_parqueadero')
    .select(`
      id, hora_ingreso, hora_salida, estado, valor_total,
      vehiculos(placa, propietario, tipos_vehiculo(nombre), tipos_usuario(nombre))
    `)
    .eq('vehiculos.placa', placa)
    .order('hora_ingreso', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ movimientos: data });
};

// ── GET /api/vehiculos/historial ──────────────────────────────
const historial = async (req, res) => {
  const { fecha_inicio, fecha_fin, estado, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('movimientos_parqueadero')
    .select(`
      id, hora_ingreso, hora_salida, tiempo_total_minutos,
      valor_base, descuento_aplicado, valor_total, tipo_cobro, estado,
      vehiculos(placa, propietario, tipos_vehiculo(nombre), tipos_usuario(nombre)),
      metodos_pago(nombre),
      usuarios!movimientos_parqueadero_empleado_ingreso_id_fkey(nombre)
    `, { count: 'exact' })
    .order('hora_ingreso', { ascending: false })
    .range(offset, offset + limit - 1);

  if (estado) query = query.eq('estado', estado);
  if (fecha_inicio) query = query.gte('hora_ingreso', fecha_inicio);
  if (fecha_fin)    query = query.lte('hora_ingreso', fecha_fin);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ movimientos: data, total: count, pagina: Number(page), limite: Number(limit) });
};

module.exports = {
  registrarIngreso,
  registrarSalida,
  calcularPreview,
  listarActivos,
  buscarPorPlaca,
  historial,
  ingresoValidators,
  salidaValidators,
};
