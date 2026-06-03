import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Trash2, Search } from 'lucide-react';

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

const RegistroSocios = ({ isAdmin }) => {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const { showModal } = useModal();

  const fetchSocios = async () => {
    try {
      const { data, error } = await supabase.from('usuarios').select('*').neq('dni', 'SISTEMA_CONFIG');
      if (error) throw error;
      setSocios(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching socios:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSocios();
  }, []);

  const handleDelete = async (socio) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Socio', 
      message: '¿Está seguro de eliminar este socio de la base de datos y todas las planillas?' 
    });

    if (isConfirmed) {
      try {
        const { error: errorUser } = await supabase.from('usuarios').delete().eq('id', socio.id);
        if (errorUser) throw errorUser;

        if (socio.nombreApellido) {
          const { error: errorPlanilla } = await supabase.from('planilla_mensual').delete().eq('socio', socio.nombreApellido);
          if (errorPlanilla) console.error("Error al borrar de planilla_mensual:", errorPlanilla);
        }

        fetchSocios();
      } catch (error) {
        console.error("Error deleting socio:", error);
      }
    }
  };

  const sociosFiltrados = socios.filter(socio => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = String(socio.nombreApellido || '').toLowerCase().includes(searchLower) ||
                          String(socio.jerarquia || '').toLowerCase().includes(searchLower) ||
                          String(socio.dni || '').toLowerCase().includes(searchLower);
    
    let matchesMonth = true;
    if (filterMonth) {
      if (socio.fechaNacimiento) {
        const parts = socio.fechaNacimiento.split(/[-/]/);
        if (parts.length >= 2) {
          const month = parts[1];
          matchesMonth = parseInt(month, 10) === parseInt(filterMonth, 10);
        } else {
          matchesMonth = false;
        }
      } else {
        matchesMonth = false;
      }
    }
    
    return matchesSearch && matchesMonth;
  }).sort((a, b) => {
    const rankDiff = getRankWeight(a.jerarquia) - getRankWeight(b.jerarquia);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.fechaRegistro) - new Date(b.fechaRegistro);
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dateString;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Fecha de cumpleaños - Casino de Oficiales", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableColumn = ["Nro Ord", "Jerarquía", "Nombre y Apellido", "Fecha Nac.", "Edad"];
    const tableRows = [];

    sociosFiltrados.forEach((socio, index) => {
      const nroOrd = String(index + 1).padStart(2, '0');
      const socioData = [
        nroOrd,
        socio.jerarquia || '-',
        socio.nombreApellido,
        formatDate(socio.fechaNacimiento),
        socio.edad
      ];
      tableRows.push(socioData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      headStyles: { fillColor: [25, 135, 84] },
      styles: { fontSize: 10, halign: 'center' },
      columnStyles: { 1: { halign: 'left' }, 2: { halign: 'left' } }
    });
    
    doc.save("fecha_cumpleanios_socios.pdf");
  };

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Fecha de Cumpleaños</h3>
        <button onClick={handleDownloadPDF} className="btn btn-primary d-flex gap-2">
          <Download size={18} /> Descargar PDF
        </button>
      </div>

      <div className="mb-4 d-flex gap-3 flex-column-mobile">
        <div className="position-relative flex-grow-1 w-mobile-100">
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
        <select 
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="form-control w-mobile-100"
          style={{ width: '200px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          <option value="">Todos los meses</option>
          <option value="01">Enero</option>
          <option value="02">Febrero</option>
          <option value="03">Marzo</option>
          <option value="04">Abril</option>
          <option value="05">Mayo</option>
          <option value="06">Junio</option>
          <option value="07">Julio</option>
          <option value="08">Agosto</option>
          <option value="09">Septiembre</option>
          <option value="10">Octubre</option>
          <option value="11">Noviembre</option>
          <option value="12">Diciembre</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary-green)', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'white', borderTopLeftRadius: '8px' }}>Nro Ord</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Jerarquía</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Nombre y Apellido</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Fecha Cumpleaños</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Edad</th>
                {isAdmin && <th style={{ padding: '12px 8px', color: 'white', borderTopRightRadius: '8px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {sociosFiltrados.map((socio, index) => (
                <tr key={socio.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--primary-green)' }}>{String(index + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '12px 8px' }}>{socio.jerarquia}</td>
                  <td style={{ padding: '12px 8px' }}>{socio.nombreApellido}</td>
                  <td style={{ padding: '12px 8px' }}>{formatDate(socio.fechaNacimiento)}</td>
                  <td style={{ padding: '12px 8px' }}>{socio.edad}</td>
                  {isAdmin && (
                    <td style={{ padding: '12px 8px' }}>
                      <button onClick={() => handleDelete(socio)} className="btn btn-danger" style={{ padding: '6px 12px' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {sociosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center" style={{ padding: '20px' }}>
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

export default RegistroSocios;
