import { useState } from 'react';
import { supabase } from '../supabase';
import { Eye, EyeOff } from 'lucide-react';
import { useModal } from '../context/ModalContext';

const CambiarContrasena = ({ onBack }) => {
  const { showModal } = useModal();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  
  const [mi, setMi] = useState('');
  const [ceActual, setCeActual] = useState('');
  const [nuevoCe, setNuevoCe] = useState('');
  const [confirmarCe, setConfirmarCe] = useState('');
  
  const [showCeActual, setShowCeActual] = useState(false);
  const [showNuevoCe, setShowNuevoCe] = useState(false);
  const [showConfirmarCe, setShowConfirmarCe] = useState(false);
  
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMensaje({ text: '', type: '' });
    
    if (!mi || !ceActual) {
      setMensaje({ text: 'Por favor complete ambos campos.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('dni', mi)
        .eq('ce', ceActual)
        .single();

      if (verifyError || !data) {
        setMensaje({ text: 'El DNI o la Contraseña Actual son incorrectos. Por favor, comuníquese con el administrador para subsanar el problema.', type: 'error' });
      } else {
        setUserId(data.id);
        setStep(2);
      }
    } catch (error) {
      console.error('Error al verificar:', error);
      setMensaje({ text: 'Hubo un error al verificar. Intente nuevamente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMensaje({ text: '', type: '' });
    
    if (!nuevoCe || !confirmarCe) {
      setMensaje({ text: 'Por favor complete todos los campos.', type: 'error' });
      return;
    }
    
    if (nuevoCe !== confirmarCe) {
      showModal({ type: 'alert', title: 'Atención', message: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ ce: nuevoCe })
        .eq('id', userId);

      if (updateError) throw updateError;

      await showModal({ type: 'alert', title: 'Éxito', message: 'Se actualizó correctamente la contraseña.' });
      onBack();
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      showModal({ type: 'alert', title: 'Error', message: 'Hubo un error al cambiar la contraseña.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-4">
          <div className="circle-logo animate-bounce"></div>
          <h2 className="mt-2 mb-1" style={{ color: 'var(--primary-green)' }}>Modificar Contraseña</h2>
          <p className="text-light mb-0">
            {step === 1 ? 'Ingrese sus datos para verificar su identidad' : 'Ingrese su nueva contraseña'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerify} autoComplete="off" className="d-flex flex-column gap-3">
            <div>
              <input 
                type="text" 
                placeholder="DNI (MI)" 
                value={mi}
                onChange={(e) => setMi(e.target.value)}
                required 
                autoComplete="new-password"
              />
            </div>
            
            <div className="position-relative">
              <input 
                type={showCeActual ? "text" : "password"} 
                placeholder="Contraseña Actual" 
                value={ceActual}
                onChange={(e) => setCeActual(e.target.value)}
                required 
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                className="btn btn-link position-absolute"
                style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', padding: 0, color: '#6c757d', border: 'none', background: 'none' }}
                onClick={() => setShowCeActual(!showCeActual)}
                title={showCeActual ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showCeActual ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {mensaje.text && (
              <p className={`text-center m-0 ${mensaje.type === 'error' ? 'text-danger' : 'text-success'}`} style={{ color: mensaje.type === 'error' ? 'var(--danger)' : 'var(--primary-green)' }}>
                {mensaje.text}
              </p>
            )}

            <div className="d-flex flex-row justify-content-center gap-2 mt-3" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <button 
                type="submit" 
                className="btn btn-primary flex-grow-1"
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Verificar Credenciales'}
              </button>

              <button 
                type="button"
                onClick={onBack}
                className="btn flex-grow-1"
                style={{ backgroundColor: '#6c757d', color: 'white' }}
              >
                Volver
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUpdate} autoComplete="off" className="d-flex flex-column gap-3">
            <div className="position-relative">
              <input 
                type={showNuevoCe ? "text" : "password"} 
                placeholder="Nueva Contraseña" 
                value={nuevoCe}
                onChange={(e) => setNuevoCe(e.target.value)}
                required 
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                className="btn btn-link position-absolute"
                style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', padding: 0, color: '#6c757d', border: 'none', background: 'none' }}
                onClick={() => setShowNuevoCe(!showNuevoCe)}
              >
                {showNuevoCe ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="position-relative">
              <input 
                type={showConfirmarCe ? "text" : "password"} 
                placeholder="Confirmar Nueva Contraseña" 
                value={confirmarCe}
                onChange={(e) => setConfirmarCe(e.target.value)}
                required 
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                className="btn btn-link position-absolute"
                style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', padding: 0, color: '#6c757d', border: 'none', background: 'none' }}
                onClick={() => setShowConfirmarCe(!showConfirmarCe)}
              >
                {showConfirmarCe ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {mensaje.text && (
              <p className={`text-center m-0 ${mensaje.type === 'error' ? 'text-danger' : 'text-success'}`} style={{ color: mensaje.type === 'error' ? 'var(--danger)' : 'var(--primary-green)' }}>
                {mensaje.text}
              </p>
            )}

            <div className="d-flex flex-row justify-content-center gap-2 mt-3" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <button 
                type="submit" 
                className="btn btn-primary flex-grow-1"
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>

              <button 
                type="button"
                onClick={() => {
                  setStep(1);
                  setMensaje({text:'', type:''});
                }}
                className="btn flex-grow-1"
                style={{ backgroundColor: '#6c757d', color: 'white' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Botón flotante de WhatsApp */}
      <a 
        href="https://wa.me/5491169534244?text=Hola,%20olvidé%20mi%20usuario%20o%20contraseña%20del%20Casino%20de%20Oficiales." 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-support-btn"
        title="Soporte 24/7 (WhatsApp)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
        <span>Soporte 24/7 administrador</span>
      </a>
    </div>
  );
};

export default CambiarContrasena;
