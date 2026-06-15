import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Check, X, Search } from 'lucide-react';

const AprobacionSocios = () => {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [busqueda, setBusqueda] = useState('');

  const fetchPendientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('aprobado', false);
        
      if (error) throw error;
      setPendientes(data || []);
    } catch (error) {
      console.error("Error al obtener solicitudes pendientes:", error);
      setMensaje({ text: 'Error al cargar las solicitudes pendientes.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendientes();
  }, []);

  const handleAprobar = async (usuario) => {
    try {
      // 1. Actualizar estado a aprobado: true
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ aprobado: true })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      // 2. Insertar en planilla_mensual
      const { error: planillaError } = await supabase
        .from('planilla_mensual')
        .insert([{
          socio: usuario.nombreApellido,
          jerarquia: usuario.jerarquia
        }]);

      if (planillaError) {
        console.error("Error insertando en planilla mensual (puede que ya exista):", planillaError);
        // Continuamos de todas formas
      }

      setMensaje({ text: `Usuario ${usuario.nombreApellido} aprobado exitosamente.`, type: 'success' });
      fetchPendientes();
    } catch (error) {
      console.error("Error al aprobar usuario:", error);
      setMensaje({ text: 'Error al aprobar el usuario.', type: 'error' });
    }
  };

  const handleRechazar = async (id) => {
    if (!window.confirm('¿Está seguro de que desea rechazar y eliminar esta solicitud de alta?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMensaje({ text: 'Solicitud rechazada y eliminada.', type: 'success' });
      fetchPendientes();
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      setMensaje({ text: 'Error al rechazar la solicitud.', type: 'error' });
    }
  };

  const filtrados = pendientes.filter(u => 
    u.nombreApellido?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.dni?.includes(busqueda)
  );

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3>Solicitudes de Alta Pendientes</h3>
        <button onClick={fetchPendientes} className="btn btn-secondary">Actualizar</button>
      </div>

      {mensaje.text && (
        <div className={`alert ${mensaje.type === 'error' ? 'alert-danger' : 'alert-success'} mb-3`}>
          {mensaje.text}
        </div>
      )}

      <div className="search-bar-container mb-4">
        <div className="position-relative" style={{ maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Buscar por Nombre o DNI..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <Search size={20} className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>Jerarquía</th>
              <th>Nombre y Apellido</th>
              <th>DNI (MI)</th>
              <th>Contraseña</th>
              <th>Fecha Nac. (Edad)</th>
              <th>Teléfono</th>
              <th>Fecha Solicitud</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan="6" className="text-center">No hay solicitudes pendientes.</td></tr>
            ) : (
              filtrados.map(usuario => (
                <tr key={usuario.id}>
                  <td>{usuario.jerarquia}</td>
                  <td>{usuario.nombreApellido}</td>
                  <td>{usuario.dni}</td>
                  <td>{usuario.ce}</td>
                  <td>{usuario.fechaNacimiento ? `${new Date(usuario.fechaNacimiento).toLocaleDateString()} (${usuario.edad || '-'} años)` : 'N/A'}</td>
                  <td>{usuario.telefono}</td>
                  <td>{usuario.fechaRegistro ? new Date(usuario.fechaRegistro).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-success p-1" 
                        title="Aprobar Alta"
                        onClick={() => handleAprobar(usuario)}
                      >
                        <Check size={20} />
                      </button>
                      <button 
                        className="btn btn-danger p-1" 
                        title="Rechazar y Eliminar"
                        onClick={() => handleRechazar(usuario.id)}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AprobacionSocios;
