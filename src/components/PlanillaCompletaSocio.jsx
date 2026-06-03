import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trash2, Search, Download, Edit2, Save, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useModal } from '../context/ModalContext';

const PlanillaCompletaSocio = ({ isAdmin }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const { showModal } = useModal();

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const fetchUsuarios = async () => {
    try {
      const { data: rawData, error } = await supabase.from('usuarios').select('*').neq('dni', 'SISTEMA_CONFIG');
      if (error) throw error;
      const data = rawData || [];
      
      // Ordenar por orden de carga (ID)
      data.sort((a, b) => a.id - b.id);
      
      setUsuarios(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsuarios();
  }, []);

  const handleDelete = async (user) => {
    if (!isAdmin) return;
    
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Socio', 
      message: '¿Está seguro de eliminar este socio de la base de datos y todas las planillas?' 
    });

    if (isConfirmed) {
      try {
        const { error: errorUser } = await supabase.from('usuarios').delete().eq('id', user.id);
        if (errorUser) throw errorUser;

        if (user.nombreApellido) {
          const { error: errorPlanilla } = await supabase.from('planilla_mensual').delete().eq('socio', user.nombreApellido);
          if (errorPlanilla) console.error("Error al borrar de planilla_mensual:", errorPlanilla);
        }

        fetchUsuarios();
      } catch (error) {
        console.error("Error deleting usuario:", error);
      }
    }
  };

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
      const originalUser = usuarios.find(u => u.id === id);
      const dataToSave = { ...editData };
      if (dataToSave.fechaNacimiento) {
        dataToSave.edad = calcularEdad(dataToSave.fechaNacimiento);
      }

      const { error } = await supabase.from('usuarios').update(dataToSave).eq('id', id);
      if (error) throw error;
      
      // Actualizar planilla_mensual si cambió nombre o jerarquía
      if (originalUser && (originalUser.nombreApellido !== dataToSave.nombreApellido || originalUser.jerarquia !== dataToSave.jerarquia)) {
        const updatePlanilla = {};
        if (originalUser.nombreApellido !== dataToSave.nombreApellido) updatePlanilla.socio = dataToSave.nombreApellido;
        if (originalUser.jerarquia !== dataToSave.jerarquia) updatePlanilla.jerarquia = dataToSave.jerarquia;
        
        const { error: errorPlanilla } = await supabase.from('planilla_mensual').update(updatePlanilla).eq('socio', originalUser.nombreApellido);
        if (errorPlanilla) console.error("Error actualizando planilla mensual:", errorPlanilla);
      }
      
      setEditingId(null);
      fetchUsuarios();
    } catch (error) {
      console.error("Error updating usuario:", error);
    }
  };

  const usuariosFiltrados = usuarios.filter(user => 
    (user.nombreApellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.jerarquia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.dni || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("Planilla Completa de Socios", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableColumn = ["NUM ORD", "Jerarquía", "Nombre y Apellido", "DNI (MI)", "CE", "Fecha Nac.", "Edad", "Teléfono"];
    const tableRows = [];

    usuariosFiltrados.forEach((user, index) => {
      const numOrd = String(index + 1).padStart(2, '0');
      const rowData = [
        numOrd,
        user.jerarquia || '-',
        user.nombreApellido || '-',
        user.dni || '-',
        user.ce || '-',
        user.fechaNacimiento || '-',
        user.edad || '-',
        user.telefono || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      headStyles: { fillColor: [25, 135, 84] },
      styles: { fontSize: 8 },
    });
    
    doc.save("planilla_socios.pdf");
  };

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Planilla Completa de Socios</h3>
        <button onClick={handleDownloadPDF} className="btn btn-primary d-flex gap-2">
          <Download size={18} /> Descargar PDF
        </button>
      </div>
      
      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, jerarquía o DNI..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ paddingLeft: '40px', borderRadius: '8px', border: '1px solid #ccc' }}
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary-green)', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', borderRadius: '4px 0 0 4px', color: 'white' }}>NUM ORD</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Jerarquía</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Nombre y Apellido</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>DNI (MI)</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>CE</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Fecha Nac.</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Edad</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Teléfono</th>
                {isAdmin && <th style={{ padding: '12px 8px', borderRadius: '0 4px 4px 0', textAlign: 'center', color: 'white' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((user, index) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  {editingId === user.id ? (
                    <>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{String(index + 1).padStart(2, '0')}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <select 
                          value={editData.jerarquia || ''} 
                          onChange={(e) => setEditData({...editData, jerarquia: e.target.value})}
                          style={{ width: '100%', padding: '4px' }}
                        >
                          <option value="">Seleccione...</option>
                          <option value="Oficial Mayor">Oficial Mayor</option>
                          <option value="Oficial Principal">Oficial Principal</option>
                          <option value="Sargento Ayudante">Sargento Ayudante</option>
                          <option value="Sargento Primero">Sargento Primero</option>
                          <option value="Sargento">Sargento</option>
                          <option value="Cabo Primero">Cabo Primero</option>
                          <option value="Cabo">Cabo</option>
                          <option value="Gendarme">Gendarme</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input 
                          type="text" 
                          value={editData.nombreApellido || ''} 
                          onChange={(e) => setEditData({...editData, nombreApellido: e.target.value})}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input 
                          type="text" 
                          value={editData.dni || ''} 
                          onChange={(e) => setEditData({...editData, dni: e.target.value})}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input 
                          type="text" 
                          value={editData.ce || ''} 
                          onChange={(e) => setEditData({...editData, ce: e.target.value})}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input 
                          type="date" 
                          value={editData.fechaNacimiento || ''} 
                          onChange={(e) => setEditData({...editData, fechaNacimiento: e.target.value})}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input 
                          type="text" 
                          value={calcularEdad(editData.fechaNacimiento)} 
                          disabled
                          style={{ width: '100%', padding: '4px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input 
                          type="text" 
                          value={editData.telefono || ''} 
                          onChange={(e) => setEditData({...editData, telefono: e.target.value})}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </td>
                      {isAdmin && (
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
                      )}
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{String(index + 1).padStart(2, '0')}</td>
                      <td style={{ padding: '12px 8px' }}>{user.jerarquia || '-'}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '500' }}>{user.nombreApellido}</td>
                      <td style={{ padding: '12px 8px' }}>{user.dni}</td>
                      <td style={{ padding: '12px 8px' }}>{user.ce}</td>
                      <td style={{ padding: '12px 8px' }}>{user.fechaNacimiento || '-'}</td>
                      <td style={{ padding: '12px 8px' }}>{user.edad || '-'}</td>
                      <td style={{ padding: '12px 8px' }}>{user.telefono || '-'}</td>
                      {isAdmin && (
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div className="d-flex gap-2 justify-content-center">
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleEditClick(user)}
                              style={{ padding: '6px 10px' }}
                              title="Editar socio"
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
                      )}
                    </>
                  )}
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="text-center" style={{ padding: '20px' }}>
                    No se encontraron socios registrados.
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

export default PlanillaCompletaSocio;
