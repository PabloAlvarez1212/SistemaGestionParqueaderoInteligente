import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, LogIn, LogOut, DollarSign, Activity, TrendingUp, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { formatCOP, formatDate, tiempoTranscurrido } from '../utils/formatters';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, value, label, color, iconBg }) => (
  <div className="stat-card" style={{ '--accent-color': color, '--icon-bg': iconBg }}>
    <div className="stat-icon">
      <Icon size={22} color={color} />
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState({ vehiculos_activos: 0, ingresos_hoy: 0, recaudo_hoy: 0, recaudo_por_hora: [] });
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashRes, activosRes] = await Promise.all([
        api.get('/reportes/dashboard'),
        api.get('/vehiculos/activos'),
      ]);
      setStats(dashRes.data);
      setActivos(activosRes.data.vehiculos_activos?.slice(0, 6) || []);
    } catch {
      toast.error('Error cargando el dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, []);

  // Datos reales de la API
  const chartData = stats.recaudo_por_hora || [];

  if (loading) return <div className="spinner" />;

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={Car}       value={stats.vehiculos_activos}
          label="Vehículos en parqueadero"
          color="#10b981"  iconBg="rgba(16,185,129,.12)"
        />
        <StatCard
          icon={Activity}  value={stats.ingresos_hoy}
          label="Ingresos registrados hoy"
          color="#3b82f6"  iconBg="rgba(59,130,246,.12)"
        />
        <StatCard
          icon={DollarSign} value={formatCOP(stats.recaudo_hoy)}
          label="Recaudo del día"
          color="#f59e0b"   iconBg="rgba(245,158,11,.12)"
        />
        <StatCard
          icon={TrendingUp} value={stats.vehiculos_activos > 0 ? 'Activo' : 'Sin mov.'}
          label="Estado del parqueadero"
          color="#8b5cf6"   iconBg="rgba(139,92,246,.12)"
        />
      </div>

      {/* Gráfica de recaudo + Tabla activos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Gráfica */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><TrendingUp size={17} color="var(--accent)" /> Recaudo por hora (hoy)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hora" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                formatter={v => [formatCOP(v), 'Recaudo']}
              />
              <Area type="monotone" dataKey="recaudo" stroke="#10b981" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehículos activos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Car size={17} color="var(--blue)" /> Vehículos Activos</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/vehiculos')}>
              Ver todos
            </button>
          </div>
          {activos.length === 0 ? (
            <div className="empty-state"><Car size={40} /><p>No hay vehículos en el parqueadero</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activos.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59,130,246,.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Car size={18} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{m.vehiculos?.placa}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {m.vehiculos?.tipos_vehiculo?.nombre} · {m.vehiculos?.tipos_usuario?.nombre}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)' }}>
                    <Clock size={12} />
                    {tiempoTranscurrido(m.hora_ingreso)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Acciones Rápidas</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/ingreso')}>
            <LogIn  size={16} /> Registrar Ingreso
          </button>
          <button className="btn btn-blue" onClick={() => navigate('/salida')}>
            <LogOut size={16} /> Registrar Salida
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/vehiculos')}>
            <Car    size={16} /> Ver Vehículos
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
