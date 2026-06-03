import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import Login from './components/Login';
import Layout from './components/Layout';

import PanelPrincipal from './components/PanelPrincipal';
import DocumentacionGastos from './components/DocumentacionGastos';
import PlanillaMensual from './components/PlanillaMensual';
import GaleriaFotografica from './components/GaleriaFotografica';
import Balance from './components/Balance';
import RegistroSocios from './components/RegistroSocios';
import PanelAdministrador from './components/PanelAdministrador';
import Estadisticas from './components/Estadisticas';
import InstallPrompt from './components/InstallPrompt';
import Mantenimiento from './components/Mantenimiento';
import { ModalProvider } from './context/ModalContext';

function App() {
  const [user, setUser] = useState(null);
  const [maintenanceActive, setMaintenanceActive] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('dni', 'SISTEMA_CONFIG');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setMaintenanceActive(data[0].ce === 'true');
        } else {
          // Si no existe la configuración, la creamos
          await supabase.from('usuarios').insert([{
            dni: 'SISTEMA_CONFIG',
            nombreApellido: 'CONFIGURACION_SISTEMA',
            ce: 'false'
          }]);
          setMaintenanceActive(false);
        }
      } catch (e) {
        console.error("Error al obtener estado de mantenimiento:", e);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 10000); // Polling cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setUser(null);
  };

  // Si está activo el modo mantenimiento y el usuario es un socio común (rol !== admin)
  if (maintenanceActive && user && user.role !== 'admin') {
    return <Mantenimiento onLogout={handleLogout} />;
  }

  return (
    <ModalProvider>
      <InstallPrompt />
      <BrowserRouter>
        <Routes>
        <Route 
          path="/" 
          element={!user ? <Login onLogin={setUser} /> : <Navigate to={user.role === 'admin' ? "/admin" : "/panel"} />} 
        />
        
        {/* Rutas protegidas dentro del Layout */}
        <Route element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/" />}>
          <Route path="/panel" element={<PanelPrincipal user={user} />} />
          <Route path="/documentacion" element={<DocumentacionGastos isAdmin={false} />} />
          <Route path="/planilla" element={<PlanillaMensual isAdmin={false} />} />
          <Route path="/galeria" element={<GaleriaFotografica isAdmin={false} />} />
          <Route path="/balance" element={<Balance isAdmin={false} />} />
          <Route path="/socios" element={<RegistroSocios isAdmin={false} />} />
          <Route path="/estadisticas" element={<Estadisticas isAdmin={false} />} />
          <Route path="/admin" element={user?.role === 'admin' ? <PanelAdministrador /> : <Navigate to="/panel" />} />
        </Route>
        </Routes>
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
