import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import PlanillaMensual from './PlanillaMensual';
import DocumentacionGastos from './DocumentacionGastos';
import GaleriaFotografica from './GaleriaFotografica';
import Balance from './Balance';
import RegistroSocios from './RegistroSocios';
import RegistroNuevoUsuario from './RegistroNuevoUsuario';
import PlanillaCompletaSocio from './PlanillaCompletaSocio';
import Estadisticas from './Estadisticas';
import AccesoSocio from './AccesoSocio';
import CapacidadSupabase from './CapacidadSupabase';
import { AlertTriangle, Settings } from 'lucide-react';

const PanelAdministrador = () => {
  const [activeTab, setActiveTab] = useState('planilla');
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  const fetchMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('dni', 'SISTEMA_CONFIG');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setMaintenanceActive(data[0].ce === 'true');
      } else {
        // Si no existe, crear por defecto
        await supabase.from('usuarios').insert([{
          dni: 'SISTEMA_CONFIG',
          nombreApellido: 'CONFIGURACION_SISTEMA',
          ce: 'false'
        }]);
        setMaintenanceActive(false);
      }
    } catch (e) {
      console.error("Error al obtener estado de mantenimiento:", e);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMaintenanceStatus();
  }, []);

  const handleToggleMaintenance = async (e) => {
    const isChecked = e.target.checked;
    setMaintenanceActive(isChecked);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ce: isChecked ? 'true' : 'false' })
        .eq('dni', 'SISTEMA_CONFIG');
      
      if (error) throw error;
    } catch (e) {
      console.error("Error al actualizar estado de mantenimiento:", e);
      alert("No se pudo actualizar el estado de mantenimiento en la base de datos.");
      setMaintenanceActive(!isChecked);
    }
  };

  const tabs = [
    { id: 'planilla', label: 'Planilla Mensual' },
    { id: 'documentacion', label: 'Documentación' },
    { id: 'galeria', label: 'Galería' },
    { id: 'balance', label: 'Balance' },
    { id: 'nuevoSocio', label: 'Alta Socio' },
    { id: 'socios', label: 'Fecha de cumpleaños' },
    { id: 'planillaCompleta', label: 'Planilla Completa Socio' },
    { id: 'accesoSocio', label: 'Acceso Socio' },
    { id: 'estadisticas', label: 'Estadísticas' },
    { id: 'capacidad', label: 'Capacidad Supabase' }
  ];

  return (
    <div className="container" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <h2 className="mb-4">Panel de Control (Administrador)</h2>
      <p className="text-light mb-4">
        Desde este panel usted puede cargar, modifier, eliminar y guardar datos del sistema.
      </p>

      {/* Tarjeta de Estado del Sistema y Mantenimiento */}
      <div className="card mb-4" style={{
        borderLeft: maintenanceActive ? '4px solid var(--danger)' : '4px solid var(--primary-green)',
        background: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease'
      }}>
        <div className="maintenance-card-content">
          <div className="maintenance-card-left">
            <div style={{
              background: maintenanceActive ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)',
              color: maintenanceActive ? 'var(--danger)' : 'var(--primary-green)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {maintenanceActive ? <AlertTriangle size={24} /> : <Settings size={24} />}
            </div>
            <div>
              <h4 className="m-0" style={{ fontWeight: '700', color: '#1f2d3d' }}>
                Estado del Sistema: {maintenanceActive ? 'Mantenimiento Activo' : 'Operativo'}
              </h4>
              <p className="m-0 text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                {maintenanceActive 
                  ? 'Los socios verán la pantalla de mantenimiento (404). Usted puede seguir operando con normalidad.' 
                  : 'Los socios pueden ingresar y realizar propuestas y ver documentos normalmente.'}
              </p>
            </div>
          </div>
          
          <div className="maintenance-card-right">
            <label htmlFor="maintenance-toggle" style={{
              fontWeight: '600',
              color: 'var(--text-dark, #495057)',
              cursor: 'pointer',
              userSelect: 'none',
              margin: '0 10px 0 0'
            }}>
              {loadingMaintenance ? 'Cargando...' : 'Modo Mantenimiento'}
            </label>
            <label className="switch-toggle">
              <input
                type="checkbox"
                id="maintenance-toggle"
                checked={maintenanceActive}
                onChange={handleToggleMaintenance}
                disabled={loadingMaintenance}
              />
              <span className="slider-toggle"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E0E0E0', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className="admin-tab"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 auto',
                textAlign: 'center',
                padding: '16px 12px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--primary-green)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--primary-green)' : 'var(--text-light)',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content">
        {activeTab === 'planilla' && <PlanillaMensual isAdmin={true} />}
        {activeTab === 'documentacion' && <DocumentacionGastos isAdmin={true} />}
        {activeTab === 'galeria' && <GaleriaFotografica isAdmin={true} />}
        {activeTab === 'balance' && <Balance isAdmin={true} />}
        {activeTab === 'nuevoSocio' && <RegistroNuevoUsuario />}
        {activeTab === 'socios' && <RegistroSocios isAdmin={true} />}
        { activeTab === 'planillaCompleta' && <PlanillaCompletaSocio isAdmin={true} /> }
        { activeTab === 'accesoSocio' && <AccesoSocio /> }
        { activeTab === 'estadisticas' && <Estadisticas /> }
        { activeTab === 'capacidad' && <CapacidadSupabase /> }
      </div>
    </div>
  );
};

export default PanelAdministrador;
