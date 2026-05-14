const supabase = require('../config/supabase');

// ── GET /api/reportes/dashboard ───────────────────────────────
const dashboard = async (req, res) => {
  const hoy = new Date();
  
  // Rango local de hoy: desde 00:00:00 hasta 23:59:59
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0).toISOString();
  const finHoy    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

  const [activosRes, hoyRes, recaudoRes] = await Promise.all([
    supabase.from('movimientos_parqueadero').select('id', { count: 'exact' }).eq('estado', 'activo'),
    
    // Movimientos del día: Ingresos de hoy OR Salidas de hoy
    supabase.from('movimientos_parqueadero')
      .select('id', { count: 'exact' })
      .or(`hora_ingreso.gte.${inicioHoy},hora_salida.gte.${inicioHoy}`)
      .or(`hora_ingreso.lte.${finHoy},hora_salida.lte.${finHoy}`),
    
    supabase.from('movimientos_parqueadero').select('valor_total')
      .eq('estado', 'completado').gte('hora_salida', inicioHoy).lte('hora_salida', finHoy),
  ]);

  const recaudoHoy = (recaudoRes.data || []).reduce((sum, r) => sum + Number(r.valor_total || 0), 0);

  // Calcular recaudo por hora para la gráfica
  const recaudoPorHora = {};
  // Inicializar horas de 08:00 a 22:00
  for (let h = 8; h <= 22; h++) {
    const key = `${h.toString().padStart(2, '0')}:00`;
    recaudoPorHora[key] = 0;
  }

  (recaudoRes.data || []).forEach(m => {
    if (m.hora_salida) {
      const hora = new Date(m.hora_salida).getHours();
      const key = `${hora.toString().padStart(2, '0')}:00`;
      if (recaudoPorHora[key] !== undefined) {
        recaudoPorHora[key] += Number(m.valor_total || 0);
      }
    }
  });

  const chartData = Object.entries(recaudoPorHora).map(([hora, recaudo]) => ({
    hora,
    recaudo
  })).sort((a, b) => a.hora.localeCompare(b.hora));

  return res.json({
    vehiculos_activos: activosRes.count || 0,
    ingresos_hoy:      hoyRes.count || 0,
    recaudo_hoy:       recaudoHoy,
    recaudo_por_hora:  chartData,
  });
};

// ── GET /api/reportes/ingresos-diarios ────────────────────────
const ingresosDiarios = async (req, res) => {
  const { fecha } = req.query;
  const dia = fecha ? new Date(fecha + 'T00:00:00') : new Date();
  const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0).toISOString();
  const fin    = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('movimientos_parqueadero')
    .select(`
      id, hora_ingreso, hora_salida, valor_total, tipo_cobro, estado,
      vehiculos(placa, tipos_vehiculo(nombre), tipos_usuario(nombre)),
      metodos_pago(nombre),
      usuarios!movimientos_parqueadero_empleado_ingreso_id_fkey(nombre)
    `)
    .or(`hora_ingreso.gte.${inicio},hora_salida.gte.${inicio}`)
    .or(`hora_ingreso.lte.${fin},hora_salida.lte.${fin}`)
    .order('hora_ingreso', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const total_recaudo = (data || [])
    .filter(m => m.estado === 'completado' && m.hora_salida >= inicio && m.hora_salida <= fin)
    .reduce((s, m) => s + Number(m.valor_total || 0), 0);

  return res.json({ 
    fecha: dia.toISOString().split('T')[0], 
    movimientos: data, 
    total_recaudo, 
    total_movimientos: data.length 
  });
};

// ── GET /api/reportes/vehiculos-activos ───────────────────────
const vehiculosActivos = async (req, res) => {
  const { data, error } = await supabase
    .from('movimientos_parqueadero')
    .select(`
      id, hora_ingreso,
      vehiculos(placa, propietario, tipos_vehiculo(nombre), tipos_usuario(nombre)),
      usuarios!movimientos_parqueadero_empleado_ingreso_id_fkey(nombre)
    `)
    .eq('estado', 'activo')
    .order('hora_ingreso', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ vehiculos_activos: data, total: data.length });
};

// ── GET /api/reportes/recaudo ─────────────────────────────────
const recaudo = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  let query = supabase
    .from('movimientos_parqueadero')
    .select('valor_total, tipo_cobro, metodos_pago(nombre), hora_salida')
    .eq('estado', 'completado');

  if (fecha_inicio) query = query.gte('hora_salida', fecha_inicio);
  if (fecha_fin)    query = query.lte('hora_salida', fecha_fin);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const total = data.reduce((s, m) => s + Number(m.valor_total || 0), 0);
  const porMetodo = data.reduce((acc, m) => {
    const nombre = m.metodos_pago?.nombre || 'sin_metodo';
    acc[nombre] = (acc[nombre] || 0) + Number(m.valor_total || 0);
    return acc;
  }, {});
  const porTipo = data.reduce((acc, m) => {
    acc[m.tipo_cobro] = (acc[m.tipo_cobro] || 0) + Number(m.valor_total || 0);
    return acc;
  }, {});

  return res.json({ total_recaudo: total, por_metodo_pago: porMetodo, por_tipo_cobro: porTipo, total_transacciones: data.length });
};

// ── GET /api/reportes/por-tipo-usuario ────────────────────────
const porTipoUsuario = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  let query = supabase
    .from('movimientos_parqueadero')
    .select('valor_total, tipo_cobro, vehiculos(tipos_usuario(nombre))')
    .eq('estado', 'completado');

  if (fecha_inicio) query = query.gte('hora_salida', fecha_inicio);
  if (fecha_fin)    query = query.lte('hora_salida', fecha_fin);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const resumen = data.reduce((acc, m) => {
    const tipo = m.vehiculos?.tipos_usuario?.nombre || 'desconocido';
    if (!acc[tipo]) acc[tipo] = { total: 0, cantidad: 0 };
    acc[tipo].total    += Number(m.valor_total || 0);
    acc[tipo].cantidad += 1;
    return acc;
  }, {});

  return res.json({ por_tipo_usuario: resumen });
};

// ── GET /api/reportes/por-empleado ────────────────────────────
const porEmpleado = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;

  // Obtenemos todos los movimientos completados en el rango (por salida)
  // para atribuir el RECAUDO al empleado que cobró.
  let queryRecaudo = supabase
    .from('movimientos_parqueadero')
    .select(`
      valor_total,
      usuarios!movimientos_parqueadero_empleado_salida_id_fkey(nombre)
    `)
    .eq('estado', 'completado');

  if (fecha_inicio) queryRecaudo = queryRecaudo.gte('hora_salida', fecha_inicio);
  if (fecha_fin)    queryRecaudo = queryRecaudo.lte('hora_salida', fecha_fin);

  // Obtenemos todos los movimientos iniciados en el rango (por ingreso)
  // para contar los ingresos registrados por cada empleado.
  let queryIngresos = supabase
    .from('movimientos_parqueadero')
    .select(`
      usuarios!movimientos_parqueadero_empleado_ingreso_id_fkey(nombre)
    `);

  if (fecha_inicio) queryIngresos = queryIngresos.gte('hora_ingreso', fecha_inicio);
  if (fecha_fin)    queryIngresos = queryIngresos.lte('hora_ingreso', fecha_fin);

  const [resRecaudo, resIngresos] = await Promise.all([queryRecaudo, queryIngresos]);

  if (resRecaudo.error) return res.status(500).json({ error: resRecaudo.error.message });
  if (resIngresos.error) return res.status(500).json({ error: resIngresos.error.message });

  const resumen = {};

  // Procesar ingresos
  (resIngresos.data || []).forEach(m => {
    const nombre = m.usuarios?.nombre || 'Desconocido';
    if (!resumen[nombre]) resumen[nombre] = { ingresos_registrados: 0, recaudo: 0 };
    resumen[nombre].ingresos_registrados += 1;
  });

  // Procesar recaudo (salidas)
  (resRecaudo.data || []).forEach(m => {
    const nombre = m.usuarios?.nombre || 'Desconocido';
    if (!resumen[nombre]) resumen[nombre] = { ingresos_registrados: 0, recaudo: 0 };
    resumen[nombre].recaudo += Number(m.valor_total || 0);
  });

  return res.json({ por_empleado: resumen });
};

module.exports = { dashboard, ingresosDiarios, vehiculosActivos, recaudo, porTipoUsuario, porEmpleado };
