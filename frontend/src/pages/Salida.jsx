import { useState, useEffect } from 'react';
import { Search, LogOut, DollarSign, CheckCircle, Clock, Car } from 'lucide-react';
import api from '../api/axios';
import { formatCOP, formatDate, tiempoTranscurrido, getErrorMessage, TIPO_COBRO_LABEL } from '../utils/formatters';
import toast from 'react-hot-toast';

const BADGE = { normal: 'badge-blue', vip: 'badge-yellow', estudiante: 'badge-purple', gracia: 'badge-green' };

const Salida = () => {
  const [placa,       setPlaca]       = useState('');
  const [activos,     setActivos]     = useState([]);
  const [seleccionado,setSeleccionado] = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [activosRes, mpRes] = await Promise.all([
          api.get('/vehiculos/activos'),
          api.get('/tarifas/metodos-pago'),
        ]);
        setActivos(activosRes.data.vehiculos_activos || []);
        setMetodosPago(mpRes.data.metodos_pago || []);
        if (mpRes.data.metodos_pago?.length > 0) {
          setMetodoPagoId(mpRes.data.metodos_pago[0].id);
        }
      } catch { toast.error('Error cargando datos'); }
    };
    fetch();
  }, []);

  const filtrados = activos.filter(m =>
    m.vehiculos?.placa?.includes(placa.toUpperCase())
  );

  const seleccionar = async (movimiento) => {
    setSeleccionado(movimiento);
    setComprobante(null);
    setLoading(true);
    try {
      const { data } = await api.get(`/vehiculos/calcular-cobro/${movimiento.id}`);
      setPreview(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const registrarSalida = async () => {
    if (!metodoPagoId) return toast.error('Selecciona un método de pago');
    setLoading(true);
    try {
      const { data } = await api.post(`/vehiculos/salida/${seleccionado.id}`, {
        metodo_pago_id: Number(metodoPagoId),
      });
      setComprobante(data.comprobante);
      setSeleccionado(null);
      setPreview(null);
      // Refrescar activos
      const res = await api.get('/vehiculos/activos');
      setActivos(res.data.vehiculos_activos || []);
      toast.success('Salida registrada y cobro completado');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

      {/* Panel izquierdo: búsqueda y lista */}
      <div>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Car size={17} color="var(--blue)" /> Vehículos en Parqueadero</span>
            <span className="badge badge-blue">{activos.length}</span>
          </div>

          {/* Buscador */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar por placa..."
              value={placa}
              onChange={e => setPlaca(e.target.value)}
            />
          </div>

          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
            {filtrados.length === 0 ? (
              <div className="empty-state"><Car size={36} /><p>Sin vehículos activos</p></div>
            ) : filtrados.map(m => (
              <button
                key={m.id}
                onClick={() => seleccionar(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  background: seleccionado?.id === m.id ? 'var(--accent-glow)' : 'var(--bg-surface)',
                  border: `1px solid ${seleccionado?.id === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all .2s ease',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'rgba(59,130,246,.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Car size={20} color="#3b82f6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>{m.vehiculos?.placa}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {m.vehiculos?.tipos_vehiculo?.nombre} · {m.vehiculos?.tipos_usuario?.nombre}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent)' }}>
                  <Clock size={11} /> {tiempoTranscurrido(m.hora_ingreso)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho: cobro o comprobante */}
      <div>
        {comprobante ? (
          <div className="card" style={{ borderColor: 'var(--accent)', animation: 'slideUp .3s ease' }}>
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--accent)' }}>
                <CheckCircle size={17} /> Comprobante de Pago
              </span>
            </div>
            <div className="ticket">
              {[
                ['Placa',            comprobante.placa],
                ['Tipo vehículo',    comprobante.tipo_vehiculo],
                ['Tipo usuario',     comprobante.tipo_usuario],
                ['Hora ingreso',     formatDate(comprobante.hora_ingreso)],
                ['Hora salida',      formatDate(comprobante.hora_salida)],
                ['Tiempo total',     `${comprobante.tiempo_total_minutos} min`],
                ['Valor base',       formatCOP(comprobante.valor_base)],
                ['Descuento',        formatCOP(comprobante.descuento_aplicado)],
                ['Tipo de cobro',    TIPO_COBRO_LABEL[comprobante.tipo_cobro] || comprobante.tipo_cobro],
              ].map(([k, v]) => (
                <div className="ticket-row" key={k}>
                  <span className="ticket-key">{k}</span>
                  <span className="ticket-value">{v}</span>
                </div>
              ))}
              <div className="ticket-row">
                <span className="ticket-key" style={{ fontWeight: 700 }}>TOTAL A PAGAR</span>
                <span className="ticket-total">{formatCOP(comprobante.valor_total)}</span>
              </div>
            </div>
            {comprobante.detalle_cobro && (
              <div className="alert alert-info" style={{ marginTop: 12 }}>
                {comprobante.detalle_cobro}
              </div>
            )}
            <button
              className="btn btn-secondary"
              style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
              onClick={() => setComprobante(null)}
            >
              Nueva Salida
            </button>
          </div>
        ) : seleccionado ? (
          <div className="card">
            <div className="card-header">
              <span className="card-title"><DollarSign size={17} color="var(--yellow)" /> Cobro — {seleccionado.vehiculos?.placa}</span>
            </div>

            {loading ? <div className="spinner" /> : preview && (
              <>
                <div className="ticket" style={{ marginBottom: 18 }}>
                  {[
                    ['Hora ingreso',   formatDate(preview.hora_ingreso)],
                    ['Tiempo actual',  `${preview.tiempo_total_minutos} min`],
                    ['Valor base',     formatCOP(preview.valor_base)],
                    ['Descuento',      formatCOP(preview.descuento_aplicado)],
                    ['Tipo de cobro',  <span className={`badge ${BADGE[preview.tipo_cobro] || 'badge-gray'}`}>{TIPO_COBRO_LABEL[preview.tipo_cobro]}</span>],
                  ].map(([k, v]) => (
                    <div className="ticket-row" key={k}>
                      <span className="ticket-key">{k}</span>
                      <span className="ticket-value">{v}</span>
                    </div>
                  ))}
                  <div className="ticket-row">
                    <span className="ticket-key" style={{ fontWeight: 700 }}>TOTAL ESTIMADO</span>
                    <span className="ticket-total">{formatCOP(preview.valor_total)}</span>
                  </div>
                </div>

                {preview.detalle_cobro && (
                  <div className="alert alert-info" style={{ marginBottom: 16 }}>{preview.detalle_cobro}</div>
                )}

                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label" htmlFor="metodo-pago">Método de Pago</label>
                  <select
                    id="metodo-pago" className="form-select"
                    value={metodoPagoId}
                    onChange={e => setMetodoPagoId(e.target.value)}
                  >
                    {metodosPago.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nombre.charAt(0).toUpperCase() + m.nombre.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={registrarSalida}
                  disabled={loading}
                >
                  <LogOut size={18} />
                  {loading ? 'Procesando...' : `Confirmar Pago ${formatCOP(preview.valor_total)}`}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <LogOut size={48} style={{ margin: '0 auto 14px', opacity: .3 }} />
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Selecciona un vehículo</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>para calcular el cobro y registrar la salida</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Salida;
