import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Car, DollarSign, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/axios';
import { formatCOP, formatDateOnly } from '../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const Reportes = () => {
  const [rango,   setRango]   = useState({ inicio: '', fin: '' });
  const [datos,   setDatos]   = useState(null);
  const [loading, setLoading] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setRango({ inicio: hoy, fin: hoy });
  }, []);

  const fetchReportes = async () => {
    setLoading(true);
    try {
      const params = `?fecha_inicio=${rango.inicio}&fecha_fin=${rango.fin + 'T23:59:59'}`;
      const [recaudoRes, tipoRes, empleadoRes, diariosRes] = await Promise.all([
        api.get(`/reportes/recaudo${params}`),
        api.get(`/reportes/por-tipo-usuario${params}`),
        api.get(`/reportes/por-empleado${params}`),
        api.get(`/reportes/ingresos-diarios?fecha=${rango.inicio}`),
      ]);
      setDatos({
        recaudo:  recaudoRes.data,
        tipos:    tipoRes.data.por_tipo_usuario,
        empleados:empleadoRes.data.por_empleado,
        diarios:  diariosRes.data,
      });
    } catch { toast.error('Error cargando reportes'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { if (rango.inicio) fetchReportes(); }, []);

  // Transformar para gráficas
  const tiposData = datos
    ? Object.entries(datos.tipos).map(([tipo, d]) => ({ tipo, ...d }))
    : [];

  const metodoPagoData = datos
    ? Object.entries(datos.recaudo.por_metodo_pago || {}).map(([nombre, total]) => ({ nombre, total }))
    : [];

  const empleadosData = datos
    ? Object.entries(datos.empleados).map(([nombre, d]) => ({ nombre, ...d }))
    : [];

  return (
    <>
      {/* Filtro de fechas */}
      <div className="card">
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group">
            <label className="form-label">Fecha Inicio</label>
            <input type="date" className="form-input" value={rango.inicio}
              onChange={e => setRango(r => ({ ...r, inicio: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha Fin</label>
            <input type="date" className="form-input" value={rango.fin}
              onChange={e => setRango(r => ({ ...r, fin: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={fetchReportes} disabled={loading}>
            <RefreshCw size={15} /> {loading ? 'Cargando...' : 'Generar Reporte'}
          </button>
        </div>
      </div>

      {loading && <div className="spinner" />}

      {datos && !loading && (
        <>
          {/* KPIs */}
          <div className="stats-grid">
            {[
              { icon: DollarSign, value: formatCOP(datos.recaudo.total_recaudo),       label: 'Total Recaudado',       color: '#10b981', bg: 'rgba(16,185,129,.12)' },
              { icon: TrendingUp, value: datos.recaudo.total_transacciones,             label: 'Transacciones',         color: '#3b82f6', bg: 'rgba(59,130,246,.12)'  },
              { icon: Car,        value: datos.diarios.total_movimientos,               label: 'Movimientos del Día',   color: '#f59e0b', bg: 'rgba(245,158,11,.12)'  },
              { icon: Users,      value: Object.keys(datos.empleados).length,           label: 'Empleados Activos',     color: '#8b5cf6', bg: 'rgba(139,92,246,.12)'  },
            ].map(({ icon: Icon, value, label, color, bg }) => (
              <div key={label} className="stat-card" style={{ '--accent-color': color, '--icon-bg': bg }}>
                <div className="stat-icon"><Icon size={22} color={color} /></div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Gráficas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Por tipo de usuario */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <span className="card-title"><Users size={16} color="var(--accent)" /> Recaudo por Tipo de Usuario</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={tiposData} dataKey="total" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label={({ tipo, percent }) => `${tipo} ${(percent*100).toFixed(0)}%`}>
                    {tiposData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCOP(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Por método de pago */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <span className="card-title"><DollarSign size={16} color="var(--blue)" /> Recaudo por Método de Pago</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metodoPagoData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="nombre" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [formatCOP(v), 'Recaudo']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reporte por empleado */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><BarChart3 size={16} color="var(--purple)" /> Reporte por Empleado</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Empleado</th><th>Ingresos Registrados</th><th>Recaudo</th></tr>
                </thead>
                <tbody>
                  {empleadosData.map(e => (
                    <tr key={e.nombre}>
                      <td><strong>{e.nombre}</strong></td>
                      <td>{e.ingresos_registrados}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCOP(e.recaudo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalle de movimientos del día */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Car size={16} color="var(--yellow)" /> Ingresos del Día — {formatDateOnly(rango.inicio)}</span>
              <span className="badge badge-blue">{datos.diarios.total_movimientos} registros</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Placa</th><th>Tipo</th><th>Ingreso</th><th>Salida</th><th>Total</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {datos.diarios.movimientos?.slice(0, 20).map(m => (
                    <tr key={m.id}>
                      <td><strong style={{ letterSpacing: 1 }}>{m.vehiculos?.placa}</strong></td>
                      <td style={{ textTransform: 'capitalize' }}>{m.vehiculos?.tipos_vehiculo?.nombre}</td>
                      <td style={{ fontSize: 12 }}>{m.hora_ingreso ? new Date(m.hora_ingreso).toLocaleTimeString('es-CO') : '—'}</td>
                      <td style={{ fontSize: 12 }}>{m.hora_salida  ? new Date(m.hora_salida).toLocaleTimeString('es-CO')  : '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{m.valor_total != null ? formatCOP(m.valor_total) : '—'}</td>
                      <td><span className={`badge ${m.estado === 'activo' ? 'badge-green' : 'badge-blue'}`}>{m.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Reportes;
