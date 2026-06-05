import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HardDrive, TrendingUp, DollarSign } from 'lucide-react';

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#F06292', '#BA68C8', '#4DB6AC', '#AED581', '#FFD54F', '#FF8A65'];

const Estadisticas = ({ isAdmin = false }) => {
  const [balanceData, setBalanceData] = useState([]);
  const [ingresosMensuales, setIngresosMensuales] = useState([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // El límite del plan gratuito de Supabase es de 1 GB = 1024 MB
  const STORAGE_LIMIT_MB = 1024;

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Balance para Gráfico Lineal
      const { data: balanceResult, error: balanceError } = await supabase.from('balance').select('*').order('fecha', { ascending: true });
      if (balanceError) throw balanceError;
      
      // Agrupar balance por mes/año para que no sea un gráfico gigante si hay muchas entradas
      const groupedBalance = {};
      (balanceResult || []).forEach(item => {
        const date = new Date(item.fecha);
        const monthYear = `${MESES[date.getMonth()]} ${date.getFullYear()}`;
        if (!groupedBalance[monthYear]) {
          groupedBalance[monthYear] = { name: monthYear, haber: 0, debe: 0, neto: 0 };
        }
        groupedBalance[monthYear].haber += parseFloat(item.haber) || 0;
        groupedBalance[monthYear].debe += parseFloat(item.debe) || 0;
      });
      
      const balanceChartData = Object.values(groupedBalance).map(b => ({
        ...b,
        neto: b.haber - b.debe
      }));
      setBalanceData(balanceChartData);

      // 2. Fetch Planilla Mensual para Gráfico de Torta
      const { data: planillaResult, error: planillaError } = await supabase.from('planilla_mensual').select('*');
      if (planillaError) throw planillaError;

      const mensualTotales = MESES.map(mes => {
        const total = (planillaResult || []).reduce((acc, fila) => acc + (parseFloat(fila[mes]) || 0), 0);
        return { name: mes, value: total };
      }).filter(m => m.value > 0); // Solo mostramos los meses que tienen ingresos

      setIngresosMensuales(mensualTotales);

      // 3. Fetch Storage size (Aproximación listando archivos)
      // Supabase storage no tiene un endpoint "size", listamos los buckets que conocemos
      const getBucketSize = async (bucket) => {
        const { data, error } = await supabase.storage.from(bucket).list();
        if (error) return 0;
        return data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
      };

      const sizeGaleria = await getBucketSize('galeria');
      const sizeDoc = await getBucketSize('documentacion');
      
      const totalBytes = sizeGaleria + sizeDoc;
      const totalMB = totalBytes / (1024 * 1024);
      setStorageUsed(totalMB);

    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Cargando estadísticas...</div>;
  }

  const storagePercentage = (storageUsed / STORAGE_LIMIT_MB) * 100;
  let progressColor = 'var(--primary-green)';
  if (storagePercentage > 75) progressColor = 'orange';
  if (storagePercentage > 90) progressColor = 'red';

  const totalHaber = balanceData.reduce((acc, b) => acc + b.haber, 0) + ingresosMensuales.reduce((acc, b) => acc + b.value, 0);
  const totalDebe = balanceData.reduce((acc, b) => acc + b.debe, 0);
  const totalNeto = Math.abs(totalHaber - totalDebe);

  const pieData = [
    { name: 'Ingresos (Haber)', value: totalHaber },
    { name: 'Egresos (Debe)', value: totalDebe },
    { name: 'Saldo Neto', value: totalNeto }
  ].filter(d => d.value > 0);

  return (
    <div className="container p-4">
      <h2 className="mb-4">Estadísticas y Métricas</h2>

      {/* Widget de Almacenamiento (Solo Admin) */}
      {isAdmin && (
        <div className="card mb-4" style={{ backgroundColor: '#fff', borderLeft: '4px solid #17a2b8' }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="bg-info p-3 rounded text-white">
              <HardDrive size={24} />
            </div>
            <div>
              <h4 className="mb-0 text-dark">Almacenamiento de Supabase (Imágenes y Documentos)</h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Límite de Plan Gratuito: 1 GB (1024 MB)</p>
            </div>
          </div>
          <div>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ color: '#333', fontWeight: 'bold' }}>{storageUsed.toFixed(2)} MB Usados</span>
              <span style={{ color: '#333' }}>{storagePercentage.toFixed(1)}%</span>
            </div>
            <div className="progress" style={{ height: '10px' }}>
              <div 
                className="progress-bar" 
                role="progressbar" 
                style={{ width: `${storagePercentage}%`, backgroundColor: progressColor }}
                aria-valuenow={storagePercentage} 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Gráfico de Balance */}
        <div className="col-12 col-md-6">
          <div className="card h-100 mb-4" style={{ backgroundColor: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
              <TrendingUp size={20} color="var(--primary-green)" />
              <h4 className="m-0 text-dark" style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)' }}>Evolución de Balance (Ingresos vs Egresos)</h4>
            </div>
            {pieData.length === 0 ? (
              <p className="text-muted text-center mt-5">No hay datos de balance para mostrar.</p>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => {
                        let color = '#0d6efd';
                        if (entry.name.includes('Ingresos')) color = '#198754';
                        if (entry.name.includes('Egresos')) color = '#dc3545';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Torta - Ingresos Mensuales */}
        <div className="col-12 col-md-6">
          <div className="card h-100 mb-4" style={{ backgroundColor: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-4">
              <DollarSign size={20} color="var(--primary-green)" />
              <h4 className="m-0 text-dark">Ingresos Aportados por Mes</h4>
            </div>
            {ingresosMensuales.length === 0 ? (
              <p className="text-muted text-center mt-5">No hay ingresos registrados en la planilla mensual.</p>
            ) : (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ingresosMensuales}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {ingresosMensuales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
