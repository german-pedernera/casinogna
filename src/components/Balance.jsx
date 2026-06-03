import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Trash2, Plus, Search, Edit2, Save } from 'lucide-react';

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '0,00';
  return Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Balance = ({ isAdmin }) => {
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  const [nuevoHaber, setNuevoHaber] = useState('');
  const [nuevoDebe, setNuevoDebe] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ concepto: '', haber: '', debe: '' });
  const { showModal } = useModal();

  const fetchBalance = async () => {
    try {
      const { data: rawBalance, error: balanceError } = await supabase.from('balance').select('*').order('fecha', { ascending: true });
      if (balanceError) throw balanceError;
      const data = rawBalance || [];

      const { data: planillasData, error: planillaError } = await supabase.from('planilla_mensual').select('*');
      if (planillaError) throw planillaError;
      const planillas = planillasData || [];
      
      const currentYear = new Date().getFullYear();
      const virtuales = [];
      MESES.forEach((mes) => {
        const totalMes = planillas.reduce((acc, fila) => acc + (parseFloat(fila[mes]) || 0), 0);
        if (totalMes > 0) {
          virtuales.push({
            id: `virtual_${mes}`,
            concepto: `Ingresos Planilla - ${mes} ${currentYear}`,
            haber: totalMes,
            debe: 0,
            isVirtual: true
          });
        }
      });

      setBalance([...data, ...virtuales]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBalance();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nuevoConcepto) return;

    try {
      const { error } = await supabase.from('balance').insert([{
        concepto: nuevoConcepto,
        haber: Number(nuevoHaber) || 0,
        debe: Number(nuevoDebe) || 0,
        fecha: new Date().toISOString(),
      }]);
      if (error) throw error;
      setNuevoConcepto('');
      setNuevoHaber('');
      setNuevoDebe('');
      fetchBalance();
    } catch (error) {
      console.error("Error adding balance:", error);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Registro', 
      message: '¿Está seguro de eliminar esta fila?' 
    });
    
    if (isConfirmed) {
      try {
        const { error } = await supabase.from('balance').delete().eq('id', id);
        if (error) throw error;
        fetchBalance();
      } catch (error) {
        console.error("Error deleting balance:", error);
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditFormData({ concepto: item.concepto, haber: item.haber, debe: item.debe });
  };

  const handleSaveEdit = async (id) => {
    try {
      const { error } = await supabase.from('balance').update({
        concepto: editFormData.concepto,
        haber: Number(editFormData.haber) || 0,
        debe: Number(editFormData.debe) || 0
      }).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      fetchBalance();
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  const balanceFiltrado = balance.filter(item => 
    item.concepto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Balance de Ingreso / Egreso - Casino de Oficiales", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableColumn = ["Nro Ord", "Concepto de Gasto", "Haber (Entra)", "Debe (Sale)"];
    const tableRows = [];

    let totalHaber = 0;
    let totalDebe = 0;

    balanceFiltrado.forEach((item, index) => {
      totalHaber += parseFloat(item.haber) || 0;
      totalDebe += parseFloat(item.debe) || 0;
      const rowData = [
        index + 1,
        capitalizeFirstLetter(item.concepto),
        `$${formatCurrency(item.haber)}`,
        `$${formatCurrency(item.debe)}`
      ];
      tableRows.push(rowData);
    });

    tableRows.push(["", "TOTALES", `$${formatCurrency(totalHaber)}`, `$${formatCurrency(totalDebe)}`]);
    tableRows.push(["", "SALDO DISPONIBLE", "", `$${formatCurrency(totalHaber - totalDebe)}`]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      headStyles: { fillColor: [25, 135, 84] },
      styles: { fontSize: 10, halign: 'center' },
      columnStyles: { 1: { halign: 'left' } },
      didParseCell: function(data) {
        if (data.section === 'body') {
          if (data.row.index === balanceFiltrado.length) {
            // Fila de TOTALES
            data.cell.styles.fillColor = [232, 248, 245];
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.row.index === balanceFiltrado.length + 1) {
            // Fila de SALDO DISPONIBLE
            data.cell.styles.fillColor = [232, 248, 245];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    doc.save("balance_ingreso_egreso.pdf");
  };

  const totalHaberUI = balanceFiltrado.reduce((acc, item) => acc + (parseFloat(item.haber) || 0), 0);
  const totalDebeUI = balanceFiltrado.reduce((acc, item) => acc + (parseFloat(item.debe) || 0), 0);
  const saldoNetoUI = totalHaberUI - totalDebeUI;

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-column-mobile" style={{ gap: '12px', alignItems: 'stretch' }}>
        <h3 className="mb-0">Balance Ingreso / Egreso</h3>
        <button onClick={handleDownloadPDF} className="btn btn-primary d-flex justify-content-center align-items-center gap-2 btn-mobile-full">
          <Download size={18} /> Descargar PDF
        </button>
      </div>

      {isAdmin && (
        <form onSubmit={handleAdd} className="d-flex gap-4 mb-4" style={{ flexWrap: 'wrap' }} autoComplete="off">
          <input 
            type="text" 
            placeholder="Concepto de Gasto" 
            value={nuevoConcepto} 
            onChange={(e) => setNuevoConcepto(capitalizeFirstLetter(e.target.value))} 
            required 
            style={{flex: 2, minWidth: '200px'}}
          />
          <input 
            type="number" 
            placeholder="Haber ($)" 
            value={nuevoHaber} 
            onChange={(e) => setNuevoHaber(e.target.value)} 
            style={{flex: 1, minWidth: '100px'}}
          />
          <input 
            type="number" 
            placeholder="Debe ($)" 
            value={nuevoDebe} 
            onChange={(e) => setNuevoDebe(e.target.value)} 
            style={{flex: 1, minWidth: '100px'}}
          />
          <button type="submit" className="btn btn-primary d-flex gap-2">
            <Plus size={18} /> Agregar
          </button>
        </form>
      )}

      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar movimiento por concepto..." 
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--primary-green)' }}>
                <th style={{ padding: '12px 8px' }}>Nro Ord</th>
                <th style={{ padding: '12px 8px' }}>Concepto de Gasto</th>
                <th style={{ padding: '12px 8px' }}>Haber (Entra)</th>
                <th style={{ padding: '12px 8px' }}>Debe (Sale)</th>
                {isAdmin && <th style={{ padding: '12px 8px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {balanceFiltrado.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px' }}>{index + 1}</td>
                  {editingId === item.id ? (
                    <>
                      <td style={{ padding: '12px 8px' }}>
                        <input type="text" value={editFormData.concepto} onChange={e => setEditFormData({...editFormData, concepto: capitalizeFirstLetter(e.target.value)})} style={{width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc'}} />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input type="number" value={editFormData.haber} onChange={e => setEditFormData({...editFormData, haber: e.target.value})} style={{width: '100px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc'}} />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input type="number" value={editFormData.debe} onChange={e => setEditFormData({...editFormData, debe: e.target.value})} style={{width: '100px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc'}} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 8px' }}>{capitalizeFirstLetter(item.concepto)}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--primary-green)', whiteSpace: 'nowrap' }}>$ {formatCurrency(item.haber)}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--danger)', fontWeight: '600', whiteSpace: 'nowrap' }}>$ {formatCurrency(item.debe)}</td>
                    </>
                  )}
                  {isAdmin && (
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {!item.isVirtual && (
                        <div className="d-flex justify-content-center gap-2">
                          {editingId === item.id ? (
                            <button 
                              className="btn btn-success" 
                              onClick={() => handleSaveEdit(item.id)}
                              style={{ padding: '6px 10px' }}
                              title="Guardar cambios"
                            >
                              <Save size={16} />
                            </button>
                          ) : (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleEditClick(item)}
                              style={{ padding: '6px 10px', backgroundColor: '#0d6efd', border: 'none' }}
                              title="Editar fila"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleDelete(item.id)}
                            style={{ padding: '6px 10px' }}
                            title="Eliminar fila"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {balanceFiltrado.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="text-center" style={{ padding: '20px' }}>
                    No se encontraron movimientos.
                  </td>
                </tr>
              )}
            </tbody>
            {balanceFiltrado.length > 0 && (
              <tfoot style={{ backgroundColor: '#E8F8F5', borderTop: '2px solid var(--primary-green)' }}>
                <tr>
                  <td colSpan="2" style={{ padding: '16px 16px', textAlign: 'left', fontWeight: 'bold', color: '#1C2833', fontSize: '1rem' }}>
                    TOTALES:
                  </td>
                  <td style={{ padding: '16px 8px', color: 'var(--primary-green)', fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                    $ {formatCurrency(totalHaberUI)}
                  </td>
                  <td style={{ padding: '16px 8px', color: 'var(--danger)', fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                    $ {formatCurrency(totalDebeUI)}
                  </td>
                  {isAdmin && <td></td>}
                </tr>
                <tr>
                  <td colSpan="2" style={{ padding: '16px 16px', textAlign: 'left', fontWeight: 'bold', color: '#1C2833', fontSize: '1rem', borderTop: '1px solid #D4EFDF' }}>
                    SALDO NETO:
                  </td>
                  <td colSpan="2" style={{ padding: '16px 8px', color: saldoNetoUI >= 0 ? 'var(--primary-green)' : 'var(--danger)', fontWeight: '800', fontSize: '1.25rem', borderTop: '1px solid #D4EFDF', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    $ {formatCurrency(saldoNetoUI)}
                  </td>
                  {isAdmin && <td style={{ borderTop: '1px solid #D4EFDF' }}></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default Balance;
