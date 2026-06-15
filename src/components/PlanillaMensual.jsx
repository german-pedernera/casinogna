import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Trash2, Edit2, Save, X, Search, RotateCcw } from 'lucide-react';

const getRankWeight = (jerarquia) => {
  const ranks = {
    "Comandante General": 1,
    "Comandante Mayor": 2,
    "Comandante Principal": 3,
    "Comandante": 4,
    "Segundo Comandante": 5,
    "Primer Alférez": 6,
    "Alférez": 7,
    "Subalférez": 8,
    "Suboficial Mayor": 9,
    "Oficial Mayor": 9,
    "Suboficial Principal": 10,
    "Oficial Principal": 10,
    "Sargento Ayudante": 11,
    "Sargento Primero": 12,
    "Sargento": 13,
    "Cabo Primero": 14,
    "Cabo": 15,
    "Gendarme": 16
  };
  return ranks[jerarquia] || 99;
};

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const PlanillaMensual = ({ isAdmin }) => {
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isGlobalEdit, setIsGlobalEdit] = useState(false);
  const [editingData, setEditingData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const { showModal } = useModal();

  const JERARQUIAS = [
    "Oficial Mayor", "Oficial Principal", "Sargento Ayudante", 
    "Sargento Primero", "Sargento", "Cabo Primero", "Cabo", "Gendarme"
  ];

  const fetchPlanilla = async () => {
    try {
      const { data, error } = await supabase
        .from('planilla_mensual')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      
      // Eliminar duplicados si existen en la BD por error
      const uniqueData = [];
      const seen = new Set();
      (data || []).forEach(row => {
        const socioKey = row.socio ? row.socio.trim().toLowerCase() : '';
        if (socioKey && !seen.has(socioKey)) {
          seen.add(socioKey);
          uniqueData.push(row);
        }
      });
      
      setFilas(uniqueData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching planilla:", error);
      setLoading(false);
    }
  };

  const filasFiltradas = filas.filter(fila => 
    (fila.socio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fila.jerarquia || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const orderA = a.num_orden && a.num_orden > 0 ? a.num_orden : 999999;
    const orderB = b.num_orden && b.num_orden > 0 ? b.num_orden : 999999;
    if (orderA !== orderB) return orderA - orderB;
    
    const rankDiff = getRankWeight(a.jerarquia) - getRankWeight(b.jerarquia);
    if (rankDiff !== 0) return rankDiff;
    return a.id - b.id;
  });

  const calcularTotalFila = (fila) => {
    return MESES.reduce((acc, mes) => acc + (parseFloat(fila[mes]) || 0), 0);
  };

  const calcularTotalMes = (mes) => {
    return filasFiltradas.reduce((acc, fila) => acc + (parseFloat(fila[mes]) || 0), 0);
  };

  const calcularTotalGeneral = () => {
    return filasFiltradas.reduce((acc, fila) => acc + calcularTotalFila(fila), 0);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '-';
    return '$' + Number(amount).toLocaleString('es-AR');
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlanilla();
  }, []);



  const handleDelete = async (fila) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Socio', 
      message: '¿Está seguro de eliminar este socio de la planilla y base de datos?' 
    });

    if (isConfirmed) {
      try {
        const { error: errorPlanilla } = await supabase.from('planilla_mensual').delete().eq('id', fila.id);
        if (errorPlanilla) throw errorPlanilla;

        if (fila.socio) {
           const { error: errorUser } = await supabase.from('usuarios').delete().eq('nombreApellido', fila.socio);
           if (errorUser) console.error("Error al borrar usuario:", errorUser);
        }

        fetchPlanilla();
      } catch (error) {
        console.error("Error deleting row:", error);
      }
    }
  };

  const handleReiniciarPlanilla = async () => {
    const authData = await showModal({ 
      type: 'promptLogin', 
      title: 'Autenticación Requerida', 
      message: 'Por seguridad, ingrese sus credenciales de administrador para reiniciar la planilla.' 
    });

    if (!authData || !authData.user || !authData.pass) {
      return;
    }

    try {
      setLoading(true);
      const { data: adminUser, error: authError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('dni', authData.user)
        .eq('ce', authData.pass)
        .eq('role', 'admin')
        .single();

      if (authError || !adminUser) {
        setLoading(false);
        await showModal({ type: 'alert', title: 'Acceso Denegado', message: 'Credenciales incorrectas. No tiene permiso para realizar esta acción.' });
        return;
      }

      setLoading(false);
      const isConfirmed = await showModal({ 
        type: 'confirm', 
        title: 'Confirmación Final', 
        message: '¿Está seguro que desea reiniciar a cero todos los pagos de la planilla mensual? Esta acción no se puede deshacer.' 
      });

      if (isConfirmed) {
        setLoading(true);
        const updates = {};
        MESES.forEach(mes => {
          updates[mes] = null;
        });

        const { error } = await supabase
          .from('planilla_mensual')
          .update(updates)
          .neq('id', 0); // Actualiza todos los registros
          
        if (error) throw error;
        
        await fetchPlanilla();
      }
    } catch (error) {
      console.error("Error reiniciando planilla:", error);
      setLoading(false);
    }
  };

  const handleStartGlobalEdit = () => {
    const initialData = {};
    filas.forEach(f => { initialData[f.id] = { ...f } });
    setEditingData(initialData);
    setIsGlobalEdit(true);
  };

  const handleCancelGlobalEdit = () => {
    setEditingData({});
    setIsGlobalEdit(false);
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      let successFilas = [...filas];
      const updatesPromises = [];

      for (const f of filas) {
        const currentData = editingData[f.id];
        if (!currentData) continue;
        
        const dataToSave = { ...currentData };
        MESES.forEach(m => {
          if (dataToSave[m] === "") {
            dataToSave[m] = null;
          }
        });

        // Verificar si hubo cambios para no enviar querys innecesarios
        let hasChanges = false;
        if (dataToSave.jerarquia !== f.jerarquia || dataToSave.socio !== f.socio) hasChanges = true;
        MESES.forEach(m => {
          // Convert both to strings or compare directly if null to handle number vs string gracefully
          if (String(dataToSave[m] || '') !== String(f[m] || '')) {
             hasChanges = true;
          }
        });

        if (hasChanges) {
          const promise = supabase.from('planilla_mensual').update(dataToSave).eq('id', f.id).then(({error}) => {
            if (!error) {
              successFilas = successFilas.map(fil => fil.id === f.id ? { ...fil, ...dataToSave } : fil);
            } else {
              console.error("Error actualizando fila:", f.id, error);
            }
          });
          updatesPromises.push(promise);
        }
      }
      
      await Promise.all(updatesPromises);
      setFilas(successFilas);
      setEditingData({});
      setIsGlobalEdit(false);
    } catch (error) {
      console.error("Error en guardado múltiple:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("Planilla Mensual - Casino de Oficiales", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableColumn = ["Nro Ord", "Jerarquía", "Socio", ...MESES, "Total"];
    const tableRows = [];

    filasFiltradas.forEach((fila, index) => {
      const nroOrd = String(index + 1).padStart(2, '0');
      const rowData = [nroOrd, fila.jerarquia || '-', fila.socio];
      MESES.forEach(mes => {
        rowData.push(fila[mes] ? formatCurrency(fila[mes]) : '-');
      });
      rowData.push(formatCurrency(calcularTotalFila(fila)));
      tableRows.push(rowData);
    });

    const totalRow = ["", "", "TOTALES", ...MESES.map(mes => formatCurrency(calcularTotalMes(mes))), formatCurrency(calcularTotalGeneral())];
    tableRows.push(totalRow);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      headStyles: { fillColor: [25, 135, 84] },
      styles: { fontSize: 8, halign: 'center' },
      columnStyles: { 1: { halign: 'left' }, 2: { halign: 'left' } },
      didParseCell: function(data) {
        if (data.section === 'body') {
          // Fila de TOTALES
          if (data.row.index === filasFiltradas.length) {
            data.cell.styles.fontStyle = 'bold';
          }
          // Columna "Total" (la última)
          if (data.column.index === tableColumn.length - 1) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    doc.save("planilla_mensual.pdf");
  };

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-column-mobile" style={{ gap: '12px', alignItems: 'stretch' }}>
        <h3 className="mb-0">Planilla Mensual</h3>
        <div className="d-flex gap-2 flex-column-mobile">
          {isAdmin && (
            <button onClick={handleReiniciarPlanilla} className="btn btn-warning d-flex align-items-center justify-content-center gap-2 text-dark btn-mobile-full">
              <RotateCcw size={18} /> Reiniciar a Cero
            </button>
          )}
          <button onClick={handleDownloadPDF} className="btn btn-primary d-flex align-items-center justify-content-center gap-2 btn-mobile-full">
            <Download size={18} /> Descargar PDF
          </button>
          {isAdmin && !isGlobalEdit && (
            <button onClick={handleStartGlobalEdit} className="btn btn-primary d-flex align-items-center justify-content-center gap-2 btn-mobile-full">
              <Edit2 size={18} /> Editar Planilla
            </button>
          )}
        </div>
      </div>



      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o jerarquía..." 
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
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--primary-green)' }}>
                <th style={{ padding: '8px 4px', textAlign: 'center', width: '40px', fontSize: '0.85rem' }}>Nro</th>
                <th style={{ padding: '8px 4px', textAlign: 'left', minWidth: '100px', fontSize: '0.85rem' }}>Jerarquía</th>
                <th style={{ padding: '8px 4px', textAlign: 'left', minWidth: '180px', fontSize: '0.85rem' }}>Socio</th>
                {MESES.map(mes => (
                  <th key={mes} style={{ padding: '8px 2px', fontSize: '0.85rem' }}>{mes}</th>
                ))}
                <th style={{ padding: '8px 4px', fontSize: '0.85rem' }}>Total</th>
                {isAdmin && !isGlobalEdit && <th style={{ padding: '8px 4px', position: 'sticky', right: 0, backgroundColor: 'var(--primary-color, #1a2a3a)', color: 'white', zIndex: 2, boxShadow: '-2px 0 5px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map((fila, index) => (
                <tr key={fila.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px', textAlign: 'center', color: 'var(--text-light)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--text-light)', fontSize: '0.85rem', minWidth: '100px' }}>
                    {isGlobalEdit && editingData[fila.id] ? (
                      <select 
                        value={editingData[fila.id].jerarquia || ''} 
                        onChange={(e) => setEditingData(prev => ({...prev, [fila.id]: {...prev[fila.id], jerarquia: e.target.value}}))}
                        className="form-control form-control-sm"
                        style={{ minWidth: '95px', padding: '4px', fontSize: '0.85rem' }}
                      >
                        <option value="">Jerarquía...</option>
                        {JERARQUIAS.map((j) => <option key={j} value={j}>{j}</option>)}
                      </select>
                    ) : (
                      fila.jerarquia || '-'
                    )}
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 'bold', minWidth: '180px', fontSize: '0.85rem' }}>
                    {isGlobalEdit && editingData[fila.id] ? (
                      <input 
                        type="text" 
                        value={editingData[fila.id].socio || ''} 
                        onChange={(e) => setEditingData(prev => ({...prev, [fila.id]: {...prev[fila.id], socio: e.target.value}}))}
                        className="form-control form-control-sm"
                        style={{ minWidth: '170px', fontWeight: 'bold', padding: '4px', fontSize: '0.85rem' }}
                      />
                    ) : (
                      fila.socio
                    )}
                  </td>
                  {MESES.map(mes => (
                    <td key={mes} style={{ padding: '8px 2px', fontSize: '0.85rem' }}>
                      {isAdmin && isGlobalEdit && editingData[fila.id] ? (
                        <div className="input-group input-group-sm" style={{ width: '60px', margin: '0 auto' }}>
                          <span className="input-group-text" style={{ padding: '2px', fontSize: '0.75rem' }}>$</span>
                          <input
                            type="number"
                            className="form-control text-center"
                            value={editingData[fila.id][mes] || ''}
                            onChange={(e) => setEditingData(prev => ({...prev, [fila.id]: {...prev[fila.id], [mes]: e.target.value}}))}
                            style={{ padding: '2px', fontSize: '0.8rem' }}
                            placeholder="-"
                          />
                        </div>
                      ) : (
                        <span style={{ 
                          fontWeight: fila[mes] ? '600' : 'normal',
                          color: fila[mes] ? 'var(--primary-green)' : '#999'
                        }}>
                          {fila[mes] ? formatCurrency(fila[mes]) : '-'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '8px 4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatCurrency(calcularTotalFila(fila))}
                  </td>
                  {isAdmin && !isGlobalEdit && (
                    <td style={{ padding: '8px 4px', position: 'sticky', right: 0, backgroundColor: 'var(--white)', zIndex: 1, boxShadow: '-2px 0 5px rgba(0,0,0,0.05)', borderLeft: '1px solid var(--border-color, #eee)' }}>
                      <div className="d-flex gap-2 justify-content-center">
                        <button onClick={() => handleDelete(fila)} className="btn btn-outline-danger" style={{ padding: '4px 8px' }} title="Eliminar Socio">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 17 : 16} className="text-center" style={{ padding: '20px' }}>
                    No se encontraron socios.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--light-bg)', fontWeight: 'bold', borderTop: '2px solid var(--primary-green)' }}>
                <td colSpan="3" style={{ padding: '8px', textAlign: 'right', fontSize: '0.85rem' }}>TOTALES</td>
                {MESES.map(mes => (
                  <td key={mes} style={{ padding: '8px 2px', fontSize: '0.85rem' }}>{formatCurrency(calcularTotalMes(mes))}</td>
                ))}
                <td style={{ padding: '8px 4px', fontSize: '0.85rem' }}>{formatCurrency(calcularTotalGeneral())}</td>
                {isAdmin && !isGlobalEdit && <td style={{ position: 'sticky', right: 0, backgroundColor: 'var(--light-bg)', zIndex: 1, borderLeft: '1px solid var(--border-color, #eee)' }}></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Espaciador para que el panel flotante no tape la última fila */}
      {isAdmin && isGlobalEdit && (
        <div style={{ height: '160px', width: '100%' }}></div>
      )}

      {/* Panel flotante de guardado rápido */}
      {isAdmin && isGlobalEdit && (
        <div className="floating-save-panel">
          <span className="title-text d-none d-sm-block">
            Edición de Planilla Activada
          </span>
          <button 
            onClick={handleSaveAll} 
            className="btn btn-success d-flex align-items-center justify-content-center gap-2" 
            style={{ padding: '10px 15px', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            <Save size={20} /> GUARDAR PLANILLA
          </button>
          <button 
            onClick={handleCancelGlobalEdit} 
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2" 
            style={{ padding: '10px 15px', fontSize: '1rem', fontWeight: 'bold' }}
          >
            <X size={20} /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanillaMensual;
