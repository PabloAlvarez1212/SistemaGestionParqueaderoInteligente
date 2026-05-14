// Formatea un número como moneda colombiana
export const formatCOP = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(num);
};

// Formatea una fecha ISO a formato legible
export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatDateOnly = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
};

// Calcula el tiempo transcurrido desde una fecha
export const tiempoTranscurrido = (iso) => {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60), m = diff % 60;
  return `${h}h ${m}min`;
};

// Extrae mensajes de error de respuestas de Axios
export const getErrorMessage = (err) => {
  return err?.response?.data?.error ||
    err?.response?.data?.errors?.[0]?.msg ||
    err?.message ||
    'Error desconocido';
};

export const TIPO_COBRO_LABEL = {
  normal:     'Normal',
  vip:        'VIP',
  estudiante: 'Estudiante',
  gracia:     'Gracia',
  sin_tarifa: 'Sin Tarifa',
};

export const TIPO_COBRO_COLOR = {
  normal:     '#3b82f6',
  vip:        '#f59e0b',
  estudiante: '#8b5cf6',
  gracia:     '#10b981',
  sin_tarifa: '#6b7280',
};
