import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';

const JERARQUIAS = [
  "Comandante General",
  "Comandante Mayor",
  "Comandante Principal",
  "Comandante",
  "Segundo Comandante",
  "Primer Alférez",
  "Alférez",
  "Subalférez"
];

const RegistroNuevoUsuario = ({ isSelfRegistration = false, onRegistroExitoso, onCancel }) => {
  const [formData, setFormData] = useState({
    jerarquia: '',
    nombreApellido: '',
    dni: '',
    ce: '',
    fechaNacimiento: '',
    telefono: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatName = (str) => {
    return str.split(' ').map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'nombreApellido') {
      finalValue = formatName(value);
    } else if (name === 'dni' || name === 'ce') {
      finalValue = value.replace(/\s/g, '');
    }
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar si el MI (DNI) o CE ya están registrados
      const { data: existingUsers, error: checkError } = await supabase
        .from('usuarios')
        .select('dni, ce')
        .or(`dni.eq.${formData.dni},ce.eq.${formData.ce}`);

      if (checkError) throw checkError;

      if (existingUsers && existingUsers.length > 0) {
        const isMiRegistered = existingUsers.some(u => u.dni === formData.dni);
        const isCeRegistered = existingUsers.some(u => u.ce === formData.ce);
        
        if (isMiRegistered && isCeRegistered) {
          setMensaje('Error: Ya existe un socio registrado con este MI y CE.');
        } else if (isMiRegistered) {
          setMensaje('Error: Ya existe un socio registrado con este MI.');
        } else {
          setMensaje('Error: Ya existe un socio registrado con este CE.');
        }
        return;
      }

      const edad = calcularEdad(formData.fechaNacimiento);
      const { error: userError } = await supabase
        .from('usuarios')
        .insert([{
          ...formData,
          edad: edad,
          fechaRegistro: new Date().toISOString(),
          aprobado: !isSelfRegistration // false si es self registration, true si es el admin
        }]);
        
      if (userError) throw userError;

      if (!isSelfRegistration) {
        // Crear registro automático en la planilla mensual solo si lo crea el admin
        const { error: planillaError } = await supabase
          .from('planilla_mensual')
          .insert([{
            socio: formData.nombreApellido,
            jerarquia: formData.jerarquia
          }]);

        if (planillaError) throw planillaError;
        setMensaje('Usuario registrado exitosamente.');
      } else {
        setMensaje('Su solicitud de alta ha sido enviada. Un administrador debe aprobarla antes de que pueda ingresar.');
        if (onRegistroExitoso) {
          setTimeout(() => onRegistroExitoso(), 3000);
        }
      }

      setFormData({
        jerarquia: '',
        nombreApellido: '',
        dni: '',
        ce: '',
        fechaNacimiento: '',
        telefono: ''
      });
    } catch (error) {
      console.error("Error al registrar:", error);
      setMensaje('Error: ' + (error.message || 'al registrar el usuario.'));
    }
  };

  return (
    <div className={isSelfRegistration ? "login-card" : "card"} style={isSelfRegistration ? { maxWidth: '550px' } : {}}>
      <h3 className={isSelfRegistration ? "mb-4 text-center" : "mb-4"}>Registro de Nuevo Usuario (Socio)</h3>
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3" autoComplete="off">
        <div>
          <select name="jerarquia" value={formData.jerarquia} onChange={handleChange} required autoComplete="new-password">
            <option value="" disabled hidden>Seleccione Jerarquía...</option>
            {JERARQUIAS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
        <div>
          <input type="text" name="nombreApellido" placeholder="Nombre y Apellido" value={formData.nombreApellido} onChange={handleChange} required />
        </div>
        <div className="d-flex gap-4" style={{ flexWrap: 'wrap' }}>
          <input type="text" name="dni" placeholder="DNI (MI)" value={formData.dni} onChange={handleChange} required style={{ flex: 1, minWidth: '200px' }} />
          <div className="position-relative" style={{ flex: 1, minWidth: '200px' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              name="ce" 
              placeholder="Contraseña" 
              value={formData.ce} 
              onChange={handleChange} 
              required 
              autoComplete="new-password" 
              style={{ paddingRight: '40px' }} 
            />
            <div 
              className="position-absolute" 
              style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: isSelfRegistration ? 'rgba(255, 255, 255, 0.8)' : '#555', display: 'flex', alignItems: 'center' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>
        </div>
        <div className="d-flex gap-4 align-items-center" style={{ flexWrap: 'wrap' }}>
          <div style={{flex: 1}}>
            <label className={isSelfRegistration ? "" : "text-light"} style={{fontSize: '0.9rem', display: 'block', marginBottom: '4px', color: isSelfRegistration ? 'white' : 'inherit'}}>Fecha de Nacimiento</label>
            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
          </div>
          <div style={{flex: 1}}>
            <label className={isSelfRegistration ? "" : "text-light"} style={{fontSize: '0.9rem', display: 'block', marginBottom: '4px', color: isSelfRegistration ? 'white' : 'inherit'}}>Edad</label>
            <input type="text" value={calcularEdad(formData.fechaNacimiento)} disabled style={isSelfRegistration ? {opacity: 0.7} : {backgroundColor: '#f0f0f0'}} />
          </div>
        </div>
        <div>
          <input type="tel" name="telefono" placeholder="Teléfono Particular" value={formData.telefono} onChange={handleChange} required />
        </div>
        {mensaje && <p style={{color: mensaje.includes('Error') ? (isSelfRegistration ? '#ffb3b3' : 'var(--danger)') : (isSelfRegistration ? '#b3ffb3' : 'var(--primary-green)')}}>{mensaje}</p>}
        <div className="d-flex gap-2 mt-3">
          <button type="submit" className={isSelfRegistration ? "login-btn uiverse-btn flex-grow-1" : "btn btn-primary flex-grow-1"} style={isSelfRegistration ? {margin: 0, padding: '12px'} : {}}>
            Registrar Usuario
          </button>
          {onCancel && (
            <button type="button" className={isSelfRegistration ? "login-btn uiverse-btn flex-grow-1" : "btn btn-secondary flex-grow-1"} onClick={onCancel} style={isSelfRegistration ? {margin: 0, padding: '12px', background: 'transparent', border: '1px solid white', color: 'white'} : {}}>
              Volver
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegistroNuevoUsuario;
