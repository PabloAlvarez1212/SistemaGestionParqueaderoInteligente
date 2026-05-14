import { useState, useEffect, useCallback } from 'react';
import { Search, Car, Filter, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { formatCOP, formatDate, TIPO_COBRO_LABEL } from '../utils/formatters';
import toast from 'react-hot-toast';

const BADGE_ESTADO = { activo: 'badge-green', completado: 'badge-blue' };
const BADGE_COBRO  = { normal: 'badge-blue', vip: 'badge-yellow', estudiante: 'badge-purple', gracia: 'badge-green' };

const Vehiculos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [filtros,     setFiltros]     = useState({ estado: '', page: 1 });
  const [busqueda,    setBusqueda]    = useState('');

  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: filtros.page, limit: 15 });
      if (filtros.estado) params.append('estado', filtros.estado);
      const { data } = await api.get(`/vehiculos/historial?${params}`);
      setMovimientos(data.movimientos || []);
      setTotal(data.total || 0);
    } catch { toast.error('Error cargando historial'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { fetchMovimientos(); }, [fetchMovimientos]);

  const filtradosPorPlaca = busqueda
    ? movimientos.filter(m => m.vehiculos?.placa?.includes(busqueda.toUpperCase()))
    : movimientos;

  const totalPages = Math.ceil(total / 15);

  return (
    <>
      {/* Controles */}
      <div className="card">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Búsqueda */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input" style={{ paddingLeft: 34 }}
              placeholder="Buscar por placa..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              className="form-select" style={{ width: 160 }}
              value={filtros.estado}
              onChange={e => setFiltros(f => ({ ...f, estado: e.target.value, page: 1 }))}
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="completado">Completados</option>
            </select>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={fetchMovimientos}>
            <RefreshCw size={14} /> Actualizar
          </button>

          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
            {total} registros
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner" />
          ) : filtradosPorPlaca.length === 0 ? (
            <div className="empty-state"><Car size={40} /><p>Sin registros</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Vehículo</th>
                  <th>Usuario</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
                  <th>Tiempo</th>
                  <th>Cobro</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtradosPorPlaca.map(m => (
                  <tr key={m.id}>
                    <td><strong style={{ letterSpacing: 1 }}>{m.vehiculos?.placa}</strong></td>
                    <td style={{ textTransform: 'capitalize' }}>{m.vehiculos?.tipos_vehiculo?.nombre}</td>
                    <td>
                      <span className={`badge ${BADGE_COBRO[m.tipo_cobro] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                        {m.vehiculos?.tipos_usuario?.nombre}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{formatDate(m.hora_ingreso)}</td>
                    <td style={{ fontSize: 12 }}>{m.hora_salida ? formatDate(m.hora_salida) : '—'}</td>
                    <td>{m.tiempo_total_minutos != null ? `${m.tiempo_total_minutos} min` : '—'}</td>
                    <td>
                      <span className={`badge ${BADGE_COBRO[m.tipo_cobro] || 'badge-gray'}`}>
                        {TIPO_COBRO_LABEL[m.tipo_cobro] || '—'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: m.valor_total > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {m.valor_total != null ? formatCOP(m.valor_total) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${BADGE_ESTADO[m.estado]}`}>{m.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px 0 0', borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={filtros.page <= 1}
              onClick={() => setFiltros(f => ({ ...f, page: f.page - 1 }))}
            >← Anterior</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              {filtros.page} / {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={filtros.page >= totalPages}
              onClick={() => setFiltros(f => ({ ...f, page: f.page + 1 }))}
            >Siguiente →</button>
          </div>
        )}
      </div>
    </>
  );
};

export default Vehiculos;
