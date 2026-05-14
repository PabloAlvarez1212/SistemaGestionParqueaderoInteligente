import { useState, useEffect } from 'react';
import { Car, UserCheck, LogIn, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { getErrorMessage } from '../utils/formatters';
import toast from 'react-hot-toast';

const Ingreso = () => {
  const [form, setForm] = useState({
    placa: '', tipo_vehiculo_id: '', tipo_usuario_id: '', propietario: '',
  });
  const [errors, setErrors]   = useState({});
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [tiposUsuario,  setTiposUsuario]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [ticket,   setTicket]   = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!form.placa.trim()) newErrors.placa = 'La placa es obligatoria';
    else if (!/^[A-Z0-9-]{3,10}$/i.test(form.placa)) newErrors.placa = 'Formato inválido (ej: ABC-123)';
    
    if (!form.tipo_vehiculo_id) newErrors.tipo_vehiculo_id = 'Seleccione un tipo';
    if (!form.tipo_usuario_id) newErrors.tipo_usuario_id = 'Seleccione un tipo';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [tvRes, tuRes] = await Promise.all([
          api.get('/tarifas/tipos-vehiculo'),
          api.get('/tarifas/tipos-usuario'),
        ]);
        setTiposVehiculo(tvRes.data.tipos_vehiculo);
        setTiposUsuario(tuRes.data.tipos_usuario);
        // Valores por defecto
        setForm(f => ({
          ...f,
          tipo_vehiculo_id: tvRes.data.tipos_vehiculo[0]?.id || '',
          tipo_usuario_id:  tuRes.data.tipos_usuario[0]?.id  || '',
        }));
      } catch { toast.error('Error cargando catálogos'); }
    };
    fetchCatalogos();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors(errs => {
        const next = { ...errs };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/vehiculos/ingreso', {
        ...form,
        placa:           form.placa.toUpperCase().trim(),
        tipo_vehiculo_id: Number(form.tipo_vehiculo_id),
        tipo_usuario_id:  Number(form.tipo_usuario_id),
      });
      setTicket(data.ticket);
      toast.success('¡Ingreso registrado exitosamente!');
      setForm(f => ({ ...f, placa: '', propietario: '' }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const TIPO_COLOR = { normal: 'badge-blue', vip: 'badge-yellow', estudiante: 'badge-purple' };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Formulario */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><LogIn size={17} color="var(--accent)" /> Registrar Ingreso de Vehículo</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Placa */}
            <div className="form-group">
              <label className="form-label" htmlFor="placa">Placa del Vehículo *</label>
              <input
                id="placa" name="placa"
                className={`form-input ${errors.placa ? 'border-red' : ''}`}
                placeholder="ABC-123"
                value={form.placa}
                onChange={handleChange}
                style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: 16, letterSpacing: 2 }}
                maxLength={10}
              />
              {errors.placa && <div className="form-error">{errors.placa}</div>}
            </div>

            {/* Tipo Vehículo */}
            <div className="form-group">
              <label className="form-label" htmlFor="tipo_vehiculo_id">Tipo de Vehículo *</label>
              <select
                id="tipo_vehiculo_id" name="tipo_vehiculo_id"
                className="form-select"
                value={form.tipo_vehiculo_id}
                onChange={handleChange} required
              >
                {tiposVehiculo.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1)}</option>
                ))}
              </select>
              {errors.tipo_vehiculo_id && <div className="form-error">{errors.tipo_vehiculo_id}</div>}
            </div>

            {/* Tipo Usuario */}
            <div className="form-group">
              <label className="form-label" htmlFor="tipo_usuario_id">Tipo de Usuario *</label>
              <select
                id="tipo_usuario_id" name="tipo_usuario_id"
                className="form-select"
                value={form.tipo_usuario_id}
                onChange={handleChange} required
              >
                {tiposUsuario.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1)}</option>
                ))}
              </select>
              {errors.tipo_usuario_id && <div className="form-error">{errors.tipo_usuario_id}</div>}
            </div>

            {/* Propietario */}
            <div className="form-group">
              <label className="form-label" htmlFor="propietario">Nombre del Propietario</label>
              <input
                id="propietario" name="propietario"
                className="form-input"
                placeholder="Opcional"
                value={form.propietario}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button
              type="submit" className="btn btn-primary btn-lg"
              disabled={loading}
            >
              <LogIn size={18} />
              {loading ? 'Registrando...' : 'Registrar Ingreso'}
            </button>
            <button
              type="button" className="btn btn-secondary"
              onClick={() => { setForm(f => ({ ...f, placa: '', propietario: '' })); setTicket(null); }}
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Ticket generado */}
      {ticket && (
        <div className="card" style={{ borderColor: 'var(--accent)', animation: 'slideUp .3s ease' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--accent)' }}>
              <CheckCircle size={17} /> Ticket de Ingreso Generado
            </span>
          </div>
          <div className="ticket">
            <div className="ticket-row">
              <span className="ticket-key">Placa</span>
              <span className="ticket-value" style={{ fontSize: 18, letterSpacing: 2 }}>{ticket.placa}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-key">Propietario</span>
              <span className="ticket-value">{ticket.propietario}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-key">Tipo de vehículo</span>
              <span className="ticket-value" style={{ textTransform: 'capitalize' }}>{ticket.tipo_vehiculo}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-key">Tipo de usuario</span>
              <span className={`badge ${TIPO_COLOR[ticket.tipo_usuario] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                {ticket.tipo_usuario}
              </span>
            </div>
            <div className="ticket-row">
              <span className="ticket-key">Hora de ingreso</span>
              <span className="ticket-value">{new Date(ticket.hora_ingreso).toLocaleTimeString('es-CO')}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-key">Empleado</span>
              <span className="ticket-value">{ticket.empleado}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-key">ID Movimiento</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {ticket.movimiento_id}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingreso;
