/**
 * SERVICIO DE COBRO — ParkingTech S.A.S
 * Implementa las 4 reglas de negocio sin valores quemados.
 * Todos los parámetros provienen de la tabla `tarifas` en BD.
 */

/**
 * Calcula el valor por tiempo (horas completas + minutos adicionales)
 * @param {number} minutos - Total de minutos
 * @param {Object} tarifa  - Fila de la tabla tarifas
 * @returns {number} Valor en pesos
 */
function calcularValorTiempo(minutos, tarifa) {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return horas * Number(tarifa.tarifa_hora) + minutosRestantes * Number(tarifa.tarifa_minuto);
}

/**
 * Convierte "HH:MM:SS" a minutos desde medianoche
 * @param {string} timeStr
 * @returns {number}
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Retorna los minutos desde medianoche de un Date
 * @param {Date} date
 * @returns {number}
 */
function dateToMinutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Calcula el cobro para usuario ESTUDIANTE aplicando las 3 sub-reglas.
 * Regla 3:
 *  - Caso 1: Ingresa y sale dentro del horario especial → solo tarifa fija
 *  - Caso 2: Ingresa antes del horario especial → tiempo normal antes + tarifa fija
 *  - Caso 3: Sale después del horario especial → tarifa fija + tiempo excedente
 * @param {Date} horaIngreso
 * @param {Date} horaSalida
 * @param {Object} tarifa
 * @returns {Object}
 */
function calcularCobroEstudiante(horaIngreso, horaSalida, tarifa) {
  const inicioEspecialMin = timeToMinutes(tarifa.hora_inicio_especial); // ej: 1020 (17:00)
  const finEspecialMin    = timeToMinutes(tarifa.hora_fin_especial);    // ej: 1320 (22:00)

  const ingresoMin = dateToMinutesOfDay(horaIngreso);
  const salidaMin  = dateToMinutesOfDay(horaSalida);

  let valorTotal = 0;
  const detalles = [];

  // Tiempo antes del horario especial
  if (ingresoMin < inicioEspecialMin) {
    const finAntes = Math.min(salidaMin, inicioEspecialMin);
    const minAntes = finAntes - ingresoMin;
    if (minAntes > 0) {
      const v = calcularValorTiempo(minAntes, tarifa);
      valorTotal += v;
      detalles.push(`Tiempo normal (${minAntes} min): $${v.toLocaleString('es-CO')}`);
    }
  }

  // Tiempo dentro del horario especial
  const inicioEfectivo = Math.max(ingresoMin, inicioEspecialMin);
  const finEfectivo    = Math.min(salidaMin,  finEspecialMin);
  if (inicioEfectivo < finEfectivo) {
    const tf = Number(tarifa.tarifa_especial_fija);
    valorTotal += tf;
    detalles.push(`Tarifa fija estudiantil: $${tf.toLocaleString('es-CO')}`);
  }

  // Tiempo excedente después del horario especial
  if (salidaMin > finEspecialMin) {
    const inicioExcedente = Math.max(ingresoMin, finEspecialMin);
    const minExcedente = salidaMin - inicioExcedente;
    if (minExcedente > 0) {
      const v = calcularValorTiempo(minExcedente, tarifa);
      valorTotal += v;
      detalles.push(`Tiempo excedente (${minExcedente} min): $${v.toLocaleString('es-CO')}`);
    }
  }

  return {
    valor_base:         valorTotal,
    descuento_aplicado: 0,
    valor_total:        valorTotal,
    tipo_cobro:         'estudiante',
    detalle_cobro:      detalles.join(' | '),
  };
}

/**
 * Función principal: calcula el cobro de un movimiento de parqueadero.
 * @param {Date}   horaIngreso
 * @param {Date}   horaSalida
 * @param {Object} tarifa       - Fila completa de la tabla `tarifas`
 * @param {string} tipoUsuario  - 'normal' | 'vip' | 'estudiante'
 * @returns {Object} { valor_base, descuento_aplicado, valor_total, tipo_cobro, detalle_cobro, tiempo_total_minutos }
 */
function calcularCobro(horaIngreso, horaSalida, tarifa, tipoUsuario) {
  const tiempoMs = new Date(horaSalida) - new Date(horaIngreso);
  const tiempoTotalMinutos = Math.floor(tiempoMs / 60000);

  // REGLA 4 — Tiempo de gracia
  if (tiempoTotalMinutos <= Number(tarifa.tiempo_gracia_minutos)) {
    return {
      tiempo_total_minutos: tiempoTotalMinutos,
      valor_base:           0,
      descuento_aplicado:   0,
      valor_total:          0,
      tipo_cobro:           'gracia',
      detalle_cobro:        `Tiempo de gracia (≤ ${tarifa.tiempo_gracia_minutos} min). Sin cobro.`,
    };
  }

  // REGLA 3 — Usuario Estudiante
  if (
    tipoUsuario === 'estudiante' &&
    tarifa.hora_inicio_especial &&
    tarifa.hora_fin_especial
  ) {
    const resultado = calcularCobroEstudiante(
      new Date(horaIngreso),
      new Date(horaSalida),
      tarifa
    );
    return { tiempo_total_minutos: tiempoTotalMinutos, ...resultado };
  }

  // REGLA 1 — Cobro por tiempo (base para normal y VIP)
  const valorBase = calcularValorTiempo(tiempoTotalMinutos, tarifa);

  // REGLA 2 — Usuario VIP con descuento
  if (tipoUsuario === 'vip' && Number(tarifa.descuento_porcentaje) > 0) {
    const pct      = Number(tarifa.descuento_porcentaje);
    const descuento = Math.round(valorBase * (pct / 100));
    return {
      tiempo_total_minutos: tiempoTotalMinutos,
      valor_base:           valorBase,
      descuento_aplicado:   descuento,
      valor_total:          valorBase - descuento,
      tipo_cobro:           'vip',
      detalle_cobro:        `Descuento VIP ${pct}% aplicado. Ahorro: $${descuento.toLocaleString('es-CO')}`,
    };
  }

  // Cobro NORMAL
  return {
    tiempo_total_minutos: tiempoTotalMinutos,
    valor_base:           valorBase,
    descuento_aplicado:   0,
    valor_total:          valorBase,
    tipo_cobro:           'normal',
    detalle_cobro:        `${Math.floor(tiempoTotalMinutos / 60)}h ${tiempoTotalMinutos % 60}min`,
  };
}

module.exports = { calcularCobro };
