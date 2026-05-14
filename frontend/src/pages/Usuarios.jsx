import { useState, useEffect } from 'react';
import { Users, Plus, X, Save, Trash2, Key } from 'lucide-react';
import api from '../api/axios';
import { formatDate, getErrorMessage } from '../utils/formatters';
import toast from 'react-hot-toast';

const ROLE_BADGE = { admin: 'badge-yellow', empleado: 'badge-blue' };

const initialForm = { nombre: '', email: '', password: '', rol_id: '' };

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles,    setRoles]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | 'crear' | 'password'
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(initialForm);
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Formato inválido';
    
    if (modal === 'crear') {
      if (!form.password) newErrors.password = 'La contraseña es obligatoria';
      else if (form.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    }
    
    if (modal === 'password') {
      if (!form.password) newErrors.password = 'La contraseña es obligatoria';
      else if (form.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors(e => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    }
  };

  const fetchData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([api.get('/usuarios'), api.get('/tarifas/roles')]);
      setUsuarios(uRes.data.usuarios || []);
      setRoles(rRes.data.roles || []);
      if (!form.rol_id && rRes.data.roles.length > 0) {
        setForm(f => ({ ...f, rol_id: rRes.data.roles.find(r => r.nombre === 'empleado')?.id || rRes.data.roles[0].id }));
      }
    } catch { toast.error('Error cargando datos'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const abrirCrear = () => {
    setForm({ ...initialForm, rol_id: roles.find(r => r.nombre === 'empleado')?.id || roles[0]?.id || '' });
    setModal('crear');
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/usuarios', { ...form, rol_id: Number(form.rol_id) });
      toast.success('Usuario creado correctamente');
      setModal(null);
      setErrors({});
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleActivo = async (u) => {
    try {
      await api.put(`/usuarios/${u.id}`, { activo: !u.activo });
      toast.success(`Usuario ${u.activo ? 'desactivado' : 'activado'}`);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put(`/usuarios/${selected.id}/password`, { password_nuevo: form.password });
      toast.success('Contraseña actualizada');
      setModal(null);
      setErrors({});
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Gestión de Usuarios</div>
          <div className="page-subtitle">{usuarios.length} usuarios registrados</div>
        </div>
        <button className="btn btn-primary" onClick={abrirCrear}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th><th>Email</th><th>Rol</th>
                <th>Estado</th><th>Registrado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.nombre}</strong></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.roles?.nombre] || 'badge-gray'}`}>
                      {u.roles?.nombre}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge-green' : 'badge-red'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(u.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setSelected(u); setForm({ password: '' }); setModal('password'); }}
                        title="Cambiar contraseña"
                      >
                        <Key size={13} />
                      </button>
                      <button
                        className={`btn btn-sm ${u.activo ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => toggleActivo(u)}
                        title={u.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear */}
      {modal === 'crear' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title"><Users size={17} /> Nuevo Usuario</span>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={crearUsuario}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Nombre completo', key: 'nombre',   type: 'text',     placeholder: 'Juan Pérez'           },
                  { label: 'Email',           key: 'email',    type: 'email',    placeholder: 'juan@parkingtech.com' },
                  { label: 'Contraseña',      key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
                ].map(({ label, key, type, placeholder }) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label}</label>
                    <input
                      type={type} className={`form-input ${errors[key] ? 'border-red' : ''}`} placeholder={placeholder}
                      value={form[key]} onChange={e => handleChange(key, e.target.value)}
                    />
                    {errors[key] && <div className="form-error">{errors[key]}</div>}
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-select" value={form.rol_id} onChange={e => setForm(f => ({ ...f, rol_id: e.target.value }))} required>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  <Save size={15} /> {saving ? 'Guardando...' : 'Crear Usuario'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Contraseña */}
      {modal === 'password' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title"><Key size={17} /> Cambiar Contraseña</span>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Usuario: <strong style={{ color: 'var(--text-primary)' }}>{selected?.nombre}</strong>
            </p>
            <form onSubmit={cambiarPassword}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">Nueva Contraseña</label>
                <input
                  type="password" className={`form-input ${errors.password ? 'border-red' : ''}`}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                <Save size={15} /> {saving ? 'Guardando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Usuarios;
