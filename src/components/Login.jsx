import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import { Eye, EyeOff } from 'lucide-react';
import CambiarContrasena from './CambiarContrasena';
import RegistroNuevoUsuario from './RegistroNuevoUsuario';

import './Login.css';

const Login = ({ onLogin }) => {
  const [mi, setMi] = useState('');
  const [ce, setCe] = useState('');
  const [showCe, setShowCe] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const navigate = useNavigate();
  const { showModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validar administradores hardcodeados
    const admins = [
      { user: import.meta.env.VITE_ADMIN_USER || 'Ger25$', pass: import.meta.env.VITE_ADMIN_PASS || 'Emi25$' }
    ];

    const isAdmin = admins.find(a => a.user === mi && a.pass === ce);
    
    if (isAdmin) {
      onLogin({ role: 'admin', name: mi });
      navigate('/admin');
    } else if (mi && ce) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('dni', mi)
          .eq('ce', ce);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const userData = data[0];

          if (userData.aprobado === false) {
            await showModal({ type: 'alert', title: 'Aprobación Pendiente', message: 'Su solicitud de alta aún está pendiente de aprobación por parte del administrador.' });
            return;
          }
          
          // Actualizar último acceso (ignora error si no existe la columna)
          const { error: updateError } = await supabase.from('usuarios').update({ ultimo_acceso: new Date().toISOString() }).eq('id', userData.id);
          if (updateError) console.error("Error actualizando último acceso:", updateError);

          onLogin({ 
            role: 'user', 
            name: userData.nombreApellido || mi, 
            rank: userData.jerarquia || 'Socio',
            id: userData.id,
            dni: userData.dni
          });
          navigate('/panel');
        } else {
          await showModal({ type: 'alert', title: 'Acceso Denegado', message: 'Credenciales incorrectas o usuario no registrado.' });
        }
      } catch (error) {
        console.error("Error al verificar credenciales:", error);
        await showModal({ type: 'alert', title: 'Error', message: 'Error de conexión con la base de datos.' });
      }
    } else {
      await showModal({ type: 'alert', title: 'Atención', message: 'Por favor ingrese MI y CE' });
    }
  };



  if (showChangePassword) {
    return <CambiarContrasena onBack={() => setShowChangePassword(false)} />;
  }

  if (showRegistration) {
    return (
      <div className="login-container" style={{ padding: '20px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
          <RegistroNuevoUsuario 
            isSelfRegistration={true} 
            onRegistroExitoso={() => setShowRegistration(false)} 
            onCancel={() => setShowRegistration(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center">
          <img 
            src="/gendarmeria_nacional_escudo.png" 
            alt="Logo Gendarmería" 
            style={{ width: '150px', height: 'auto', marginBottom: '15px' }} 
          />
        </div>
        <h2>Casino de Oficiales del Escuadrón de Seguridad Vial "Santa Catalina"</h2>
        <form onSubmit={handleSubmit} autoComplete="off" className="d-flex flex-column gap-3">
          <div>
            <input
              type="text"
              placeholder="MI (Usuario)"
              value={mi}
              onChange={(e) => setMi(e.target.value.replace(/\s/g, ''))}
              required
            />
          </div>
          <div className="position-relative">
            <input
              type={showCe ? "text" : "password"}
              placeholder="Contraseña"
              value={ce}
              onChange={(e) => setCe(e.target.value.replace(/\s/g, ''))}
              required
              autoComplete="new-password"
              style={{ paddingRight: '40px' }}
            />
            <button 
              type="button"
              className="btn position-absolute"
              style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', padding: 0, color: '#555', border: 'none', background: 'none', boxShadow: 'none', outline: 'none' }}
              onClick={() => setShowCe(!showCe)}
              title={showCe ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showCe ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          


          <button type="submit" className="login-btn uiverse-btn">
            Ingresar a la App
          </button>
        </form>

        <div className="social-login">

          <div className="already-account mb-3">
            ¿Ya tienes una cuenta? <br/><button type="button" onClick={() => setShowChangePassword(true)} style={{ marginTop: '5px' }}>Modificar contraseña</button>
          </div>
          <hr style={{ borderTop: '1px solid rgba(255,255,255,0.2)', width: '80%', margin: '15px auto' }} />
          <div className="already-account mt-3">
            ¿No eres socio? <br/><button type="button" onClick={() => setShowRegistration(true)} style={{ marginTop: '5px' }}>Registrarse (Alta Socio)</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
