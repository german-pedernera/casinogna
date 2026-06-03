import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Database, HardDrive, ShieldCheck, RefreshCw } from 'lucide-react';

const CapacidadSupabase = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    counts: {
      usuarios: 0,
      planilla_mensual: 0,
      propuestas: 0,
      galeria: 0,
      documentacion: 0,
      balance: 0
    },
    sizes: {
      galeria: 0,
      documentacion: 0,
      total: 0
    }
  });

  const loadCapacityData = async () => {
    try {
      const counts = {
        usuarios: 0,
        planilla_mensual: 0,
        propuestas: 0,
        galeria: 0,
        documentacion: 0,
        balance: 0
      };

      const tables = ['usuarios', 'planilla_mensual', 'propuestas', 'galeria', 'documentacion', 'balance'];
      
      // Obtener conteos de filas (head: true para máxima eficiencia)
      await Promise.all(
        tables.map(async (table) => {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          if (!error) {
            counts[table] = count || 0;
          }
        })
      );

      // Obtener tamaños de almacenamiento
      let galeriaSize = 0;
      let docSize = 0;

      const { data: galeriaFiles, error: errorGaleria } = await supabase
        .storage
        .from('galeria')
        .list('', { limit: 100 });
      
      if (!errorGaleria && galeriaFiles) {
        galeriaSize = galeriaFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
      }

      const { data: docFiles, error: errorDocs } = await supabase
        .storage
        .from('documentacion')
        .list('', { limit: 100 });
      
      if (!errorDocs && docFiles) {
        docSize = docFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
      }

      setData({
        counts,
        sizes: {
          galeria: galeriaSize,
          documentacion: docSize,
          total: galeriaSize + docSize
        }
      });
    } catch (e) {
      console.error("Error al cargar capacidad de Supabase:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCapacityData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCapacityData();
  };

  // Convertir bytes a formato legible
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Supabase Free Tier límites
  const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
  const DATABASE_ROW_LIMIT_EST = 100000; // 100k filas estimadas recomendadas para rendimiento óptimo
  
  const storagePercentage = Math.min(((data.sizes.total / STORAGE_LIMIT_BYTES) * 100), 100).toFixed(1);
  
  const totalRows = Object.values(data.counts).reduce((a, b) => a + b, 0);
  const dbPercentage = Math.min(((totalRows / DATABASE_ROW_LIMIT_EST) * 100), 100).toFixed(1);

  if (loading) {
    return (
      <div className="text-center p-5 text-light">
        <RefreshCw className="animate-spin mb-3" size={40} color="var(--primary-green)" />
        <p>Cargando métricas de capacidad de Supabase...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", padding: '0 5px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3" style={{ marginTop: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '700' }}>Capacidad del Servidor (Supabase)</h3>
          <p className="text-muted m-0" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            Monitoreo en tiempo real de consumo de base de datos y almacenamiento de archivos.
          </p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="btn btn-secondary d-flex align-items-center gap-2"
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '500' }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar métricas'}
        </button>
      </div>

      {/* Tarjetas de Almacenamiento y Base de Datos en Flexbox para corregir márgenes */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        marginBottom: '24px',
        width: '100%'
      }}>
        {/* Card Almacenamiento (Storage) */}
        <div style={{
          flex: '1 1 350px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e9ecef',
            borderRadius: '16px',
            padding: '24px',
            margin: '0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <span className="text-muted uppercase" style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                  ALMACENAMIENTO DE ARCHIVOS
                </span>
                <h4 className="m-0 mt-1" style={{ fontWeight: '800', color: '#1f2d3d' }}>
                  {formatBytes(data.sizes.total)} <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>de 1 GB</span>
                </h4>
              </div>
              <div style={{
                background: 'rgba(40, 167, 69, 0.1)',
                color: 'var(--primary-green)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HardDrive size={24} />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                <span className="text-muted">Uso del Storage</span>
                <span style={{ fontWeight: '600', color: parseFloat(storagePercentage) > 80 ? 'var(--danger)' : 'var(--primary-green)' }}>
                  {storagePercentage}%
                </span>
              </div>
              <div className="progress" style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ 
                    width: `${storagePercentage}%`,
                    backgroundColor: parseFloat(storagePercentage) > 80 ? 'var(--danger)' : 'var(--primary-green)',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease'
                  }}
                  aria-valuenow={storagePercentage} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
            </div>

            <div className="mt-auto pt-3 border-top" style={{ fontSize: '0.85rem' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Carpeta Galería (Fotos):</span>
                <strong>{formatBytes(data.sizes.galeria)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Carpeta Documentos:</span>
                <strong>{formatBytes(data.sizes.documentacion)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card Base de Datos (Row Counts) */}
        <div style={{
          flex: '1 1 350px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e9ecef',
            borderRadius: '16px',
            padding: '24px',
            margin: '0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <span className="text-muted uppercase" style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                  BASE DE DATOS
                </span>
                <h4 className="m-0 mt-1" style={{ fontWeight: '800', color: '#1f2d3d' }}>
                  {totalRows.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>filas totales</span>
                </h4>
              </div>
              <div style={{
                background: 'rgba(13, 110, 253, 0.1)',
                color: '#0d6efd',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={24} />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                <span className="text-muted">Capacidad Estimada (Límite Recomendado)</span>
                <span style={{ fontWeight: '600', color: parseFloat(dbPercentage) > 80 ? 'var(--danger)' : '#0d6efd' }}>
                  {dbPercentage}%
                </span>
              </div>
              <div className="progress" style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ 
                    width: `${dbPercentage}%`,
                    backgroundColor: parseFloat(dbPercentage) > 80 ? 'var(--danger)' : '#0d6efd',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease'
                  }}
                  aria-valuenow={dbPercentage} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
            </div>

            <div className="mt-auto pt-3 border-top" style={{ fontSize: '0.85rem' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Planilla Mensual (Filas):</span>
                <strong>{data.counts.planilla_mensual}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Socios Registrados:</span>
                <strong>{data.counts.usuarios}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Otros (Balances, Propuestas, Docs):</span>
                <strong>{data.counts.propuestas + data.counts.galeria + data.counts.documentacion + data.counts.balance}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grilla Detallada de Tablas */}
      <div className="card" style={{
        background: '#ffffff',
        border: '1px solid #e9ecef',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <h4 className="mb-3" style={{ color: '#1f2d3d', fontWeight: '700' }}>Registros detallados por tabla</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eaeded', textAlign: 'left', color: '#666', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 8px' }}>TABLA</th>
                <th style={{ padding: '12px 8px' }}>PROPÓSITO</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>REGISTROS (FILAS)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f2f4f5' }}>
                <td style={{ padding: '12px 8px', fontWeight: '600', color: '#2c3e50' }}>planilla_mensual</td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', fontSize: '0.9rem' }}>Cuotas, aportes y meses abonados por los socios</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{data.counts.planilla_mensual}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f2f4f5' }}>
                <td style={{ padding: '12px 8px', fontWeight: '600', color: '#2c3e50' }}>usuarios</td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', fontSize: '0.9rem' }}>Socios del Casino de Oficiales con acceso al sistema</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{data.counts.usuarios}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f2f4f5' }}>
                <td style={{ padding: '12px 8px', fontWeight: '600', color: '#2c3e50' }}>balance</td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', fontSize: '0.9rem' }}>Registros de contabilidad, caja, debe y haber</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{data.counts.balance}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f2f4f5' }}>
                <td style={{ padding: '12px 8px', fontWeight: '600', color: '#2c3e50' }}>propuestas</td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', fontSize: '0.9rem' }}>Sugerencias, votos y buzón de socios</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{data.counts.propuestas}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f2f4f5' }}>
                <td style={{ padding: '12px 8px', fontWeight: '600', color: '#2c3e50' }}>documentacion</td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', fontSize: '0.9rem' }}>Archivos de actas, balances PDF y descargas</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{data.counts.documentacion}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f2f4f5' }}>
                <td style={{ padding: '12px 8px', fontWeight: '600', color: '#2c3e50' }}>galeria</td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', fontSize: '0.9rem' }}>Imágenes de eventos y fotografías del Casino</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{data.counts.galeria}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-3 rounded d-flex align-items-start gap-3" style={{ backgroundColor: '#e8f4f0', border: '1px solid #d0ebd5' }}>
        <ShieldCheck size={20} color="var(--primary-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h5 style={{ margin: '0 0 5px 0', color: '#1e7e34', fontWeight: '700' }}>Plan Gratuito Supabase</h5>
          <p className="m-0 text-muted" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
            Este proyecto está operando en el plan libre de Supabase. El plan ofrece un límite de <strong>500 MB para la base de datos</strong> (suficiente para millones de filas de texto estructurado) y <strong>1 GB de espacio de Storage</strong> para almacenar PDFs y fotos de alta resolución.
          </p>
        </div>
      </div>

      <style>{`
        .progress-bar {
          background-size: 20px 20px;
          background-image: linear-gradient(
            45deg, 
            rgba(255, 255, 255, 0.15) 25%, 
            transparent 25%, 
            transparent 50%, 
            rgba(255, 255, 255, 0.15) 50%, 
            rgba(255, 255, 255, 0.15) 75%, 
            transparent 75%, 
            transparent
          );
          animation: progress-bar-stripes 1s linear infinite;
        }

        @keyframes progress-bar-stripes {
          0% { background-position: 1rem 0; }
          100% { background-position: 0 0; }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CapacidadSupabase;
