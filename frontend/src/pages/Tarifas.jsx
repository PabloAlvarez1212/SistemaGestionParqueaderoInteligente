import { useState, useEffect } from 'react';
import { DollarSign, Save, Info } from 'lucide-react';
import api from '../api/axios';
import { formatCOP, getErrorMessage } from '../utils/formatters';
import toast from 'react-hot-toast';

const TIPO_BADGE = { normal: 'badge-blue', vip: 'badge-yellow', estudiante: 'badge-purple' };

const Tarifas = () => {
  const [tarifas,  setTarifas]  = useState([]);
  const [editando, setEditando] = useState(null);  // id de fila editando
  const [draft,    setDraft]    = useState({});
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    api.get('/tarifas').then(r => setTarifas(r.data.tarifas || [])).catch(() => toast.error('Error cargando tarifas')).finally(() => setLoading(false));
  }, []);

  const iniciarEdicion = (t) => {
    setEditando(t.id);
    setErrors({});
    setDraft({
      tarifa_hora:           t.tarifa_hora,
      tarifa_minuto:         t.tarifa_minuto,
      descuento_porcentaje:  t.descuento_porcentaje,
      tarifa_especial_fija:  t.tarifa_especial_fija,
      hora_inicio_especial:  t.hora_inicio_especial || '',
      hora_fin_especial:     t.hora_fin_especial    || '',
      tiempo_gracia_minutos: t.tiempo_gracia_minutos,
    });
  };

  const validate = () => {
    const newErrors = {};
    const numericKeys = ['tarifa_hora', 'tarifa_minuto', 'tiempo_gracia_minutos', 'descuento_porcentaje', 'tarifa_especial_fija'];
    
    numericKeys.forEach(k => {
      if (draft[k] !== undefined) {
        if (draft[k] < 0) newErrors[k] = 'No puede ser negativo';
        if (k === 'tarifa_hora' && draft[k] <= 0) newErrors[k] = 'Debe ser mayor a 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const guardar = async (id) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/tarifas/${id}`, draft);
      setTarifas(ts => ts.map(t => t.id === id ? { ...t, ...data.tarifa } : t));
      setEditando(null);
      toast.success('Tarifa actualizada correctamente');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <>
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <Info size={16} />
        <span>Todas las tarifas son configurables. Los cambios aplican inmediatamente en los próximos cobros. Haz clic en <strong>Editar</strong> para modificar una tarifa.</span>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {tarifas.map(t => {
          const isEditing = editando === t.id;
          const tipoUsuario = t.tipos_usuario?.nombre;

          return (
            <div
              key={t.id}
              className="card"
              style={{ borderColor: isEditing ? 'var(--accent)' : 'var(--border)', marginBottom: 0 }}
            >
              {/* Cabecera */}
              <div className="card-header">
                <span className="card-title">
                  <DollarSign size={16} color="var(--accent)" />
                  <span style={{ textTransform: 'capitalize' }}>{t.tipos_vehiculo?.nombre}</span>
                  &nbsp;—&nbsp;
                  <span className={`badge ${TIPO_BADGE[tipoUsuario] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                    {tipoUsuario}
                  </span>
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {isEditing ? (
                    <>
                      <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => guardar(t.id)}>
                        <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
                    </>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => iniciarEdicion(t)}>Editar</button>
                  )}
                </div>
              </div>

              {/* Campos */}
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
                {[
                  { label: 'Tarifa por Hora ($)',    key: 'tarifa_hora',           type: 'number' },
                  { label: 'Tarifa por Minuto ($)',  key: 'tarifa_minuto',         type: 'number' },
                  { label: 'Tiempo de Gracia (min)', key: 'tiempo_gracia_minutos', type: 'number' },
                  ...(tipoUsuario === 'vip'
                    ? [{ label: 'Descuento VIP (%)', key: 'descuento_porcentaje', type: 'number' }]
                    : []),
                  ...(tipoUsuario === 'estudiante'
                    ? [
                        { label: 'Tarifa Fija ($)',         key: 'tarifa_especial_fija',  type: 'number' },
                        { label: 'Inicio Horario Especial', key: 'hora_inicio_especial',  type: 'time'   },
                        { label: 'Fin Horario Especial',    key: 'hora_fin_especial',     type: 'time'   },
                      ]
                    : []),
                ].map(({ label, key, type }) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label}</label>
                    {isEditing ? (
                      <>
                        <input
                          type={type} className={`form-input ${errors[key] ? 'border-red' : ''}`}
                          value={draft[key] ?? ''}
                          onChange={e => {
                            const val = type === 'number' ? Number(e.target.value) : e.target.value;
                            setDraft(d => ({ ...d, [key]: val }));
                            if (errors[key]) setErrors(errs => { const n = {...errs}; delete n[key]; return n; });
                          }}
                          min={0}
                        />
                        {errors[key] && <div className="form-error">{errors[key]}</div>}
                      </>
                    ) : (
                      <div style={{
                        padding: '10px 14px', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                      }}>
                        {type === 'number' && key !== 'tiempo_gracia_minutos' && key !== 'descuento_porcentaje'
                          ? formatCOP(t[key])
                          : `${t[key]}${key === 'descuento_porcentaje' ? '%' : key === 'tiempo_gracia_minutos' ? ' min' : ''}`
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Tarifas;
