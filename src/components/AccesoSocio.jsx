import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Edit2, Save, Trash2, X, Search } from 'lucide-react';
import { useModal } from '../context/ModalContext';

const AccesoSocio = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const { showModal } = useModal();

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase.from('usuarios').select('*').neq('dni', 'SISTEMA_CONFIG');
      if (error) throw error;
      
      // Ordenar por orden de carga (ID)
      const sortedData = (data || []).sort((a, b) => a.id - b.id);
      setUsuarios(sortedData);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsuarios();
  }, []);

  const handleEditClick = (user) => {
    setEditingId(user.id);
    setEditData({ ...user });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id) => {
    try {
      const dataToSave = { 
        dni: editData.dni,
        ce: editData.ce
      };

      const { error } = await supabase.from('usuarios').update(dataToSave).eq('id', id);
      if (error) throw error;
      
      setEditingId(null);
      await fetchUsuarios();
    } catch (error) {
      console.error("Error updating credenciales:", error);
      showModal({ type: 'alert', title: 'Error', message: 'Hubo un error al actualizar las credenciales.' });
    }
  };

  const handleDelete = async (user) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Socio', 
      message: '¿Está seguro de eliminar este socio completamente del sistema?' 
    });

    if (isConfirmed) {
      try {
        const { error: errorUser } = await supabase.from('usuarios').delete().eq('id', user.id);
        if (errorUser) throw errorUser;

        if (user.nombreApellido) {
          await supabase.from('planilla_mensual').delete().eq('socio', user.nombreApellido);
        }

        fetchUsuarios();
      } catch (error) {
        console.error("Error deleting usuario:", error);
      }
    }
  };

  const usuariosFiltrados = usuarios.filter(user => 
    (user.nombreApellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.dni || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <h3 className="mb-4">Control de Acceso de Socios</h3>
      <p className="text-light mb-4">
        Administre los nombres de usuario (MI) y contraseñas que utilizan los socios para ingresar a la plataforma.
      </p>

      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o usuario (MI)..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ paddingLeft: '40px', borderRadius: '8px' }}
        />
      </div>

      {loading ? (
        <p>Cargando datos de acceso...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary-green)', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', borderRadius: '4px 0 0 4px', color: 'white' }}>NUM ORD</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Jerarquía y Nombre</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Usuario (MI)</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Contraseña (CE)</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Último Acceso</th>
                <th style={{ padding: '12px 8px', borderRadius: '0 4px 4px 0', textAlign: 'center', color: 'white' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((user, index) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{String(index + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.9em' }}>{user.jerarquia}</span>
                    <br />
                    <strong>{user.nombreApellido}</strong>
                  </td>
                  
                  {editingId === user.id ? (
                    <>
                      <td style={{ padding: '12px 8px' }}>
                        <input 
                          type="text" 
                          value={editData.dni || ''} 
                          onChange={(e) => setEditData({...editData, dni: e.target.value.replace(/\s/g, '')})}
                          style={{ width: '100%', padding: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input 
                          type="text" 
                          value={editData.ce || ''} 
                          onChange={(e) => setEditData({...editData, ce: e.target.value.replace(/\s/g, '')})}
                          style={{ width: '100%', padding: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px', color: '#666', fontSize: '0.9em' }}>
                        {user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleString('es-AR') : 'Nunca'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          <button onClick={() => handleSave(user.id)} className="btn btn-success" style={{ padding: '6px 10px' }} title="Guardar">
                            <Save size={16} />
                          </button>
                          <button onClick={handleCancelEdit} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#0d6efd' }}>{user.dni || '-'}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '1.1em' }}>{user.ce || '-'}</td>
                      <td style={{ padding: '12px 8px', color: '#666', fontSize: '0.9em' }}>
                        {user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleString('es-AR') : 'Nunca'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleEditClick(user)}
                            style={{ padding: '6px 10px' }}
                            title="Editar credenciales"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleDelete(user)}
                            style={{ padding: '6px 10px' }}
                            title="Eliminar socio"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center" style={{ padding: '20px' }}>
                    No se encontraron socios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccesoSocio;
