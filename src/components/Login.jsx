import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import { Eye, EyeOff } from 'lucide-react';
import CambiarContrasena from './CambiarContrasena';

import './Login.css';

const Login = ({ onLogin }) => {
  const [mi, setMi] = useState('');
  const [ce, setCe] = useState('');
  const [showCe, setShowCe] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();
  const { showModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validar administradores hardcodeados
    const admins = [
      { user: 'Ger25$', pass: 'Emi25$' }
    ];

    const isAdmin = admins.find(a => a.user === mi && a.pass === ce);
    
    if (isAdmin) {
      onLogin({ role: 'admin', name: mi });
      navigate('/panel');
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
          
          // Actualizar último acceso (ignora error si no existe la columna)
          supabase.from('usuarios').update({ ultimo_acceso: new Date().toISOString() }).eq('id', userData.id).then();

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

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="text-center mb-4">
          <div className="circle-logo mx-auto"></div>
          <h2 className="mt-4" style={{ color: 'var(--primary-green)' }}>
            Casino de Oficiales del Escuadrón de Seguridad Vial “Santa Catalina”
          </h2>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off" className="d-flex flex-column gap-4">
          <div>
            <input
              type="text"
              placeholder="MI (Usuario)"
              value={mi}
              onChange={(e) => setMi(e.target.value)}
              required
            />
          </div>
          <div className="position-relative">
            <input
              type={showCe ? "text" : "password"}
              placeholder="Contraseña"
              value={ce}
              onChange={(e) => setCe(e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: '40px' }}
            />
            <button 
              type="button"
              className="btn btn-link position-absolute"
              style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', padding: 0, color: '#6c757d', border: 'none', background: 'none' }}
              onClick={() => setShowCe(!showCe)}
              title={showCe ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showCe ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="d-flex justify-content-center mt-4 flex-column align-items-center gap-3">
            <button type="submit" className="btn btn-primary w-100" style={{ maxWidth: '300px' }}>
              Ingresar a la App
            </button>
            <div className="d-flex flex-column align-items-center gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setShowChangePassword(true)}
                style={{ color: 'var(--text-light)', fontSize: '0.9rem', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                ¿Desea modificar su contraseña?
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
