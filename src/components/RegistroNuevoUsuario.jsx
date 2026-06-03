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

const RegistroNuevoUsuario = () => {
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
          fechaRegistro: new Date().toISOString()
        }]);
        
      if (userError) throw userError;

      // Crear registro automático en la planilla mensual
      const { error: planillaError } = await supabase
        .from('planilla_mensual')
        .insert([{
          socio: formData.nombreApellido,
          jerarquia: formData.jerarquia
        }]);

      if (planillaError) throw planillaError;
      setMensaje('Usuario registrado exitosamente.');
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
    <div className="card">
      <h3 className="mb-4">Registro de Nuevo Usuario (Socio)</h3>
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3" autoComplete="off">
        <div>
          <select name="jerarquia" value={formData.jerarquia} onChange={handleChange} required autoComplete="new-password">
            <option value="">Seleccione Jerarquía...</option>
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
              style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>
        </div>
        <div className="d-flex gap-4 align-items-center" style={{ flexWrap: 'wrap' }}>
          <div style={{flex: 1}}>
            <label className="text-light" style={{fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Fecha de Nacimiento</label>
            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
          </div>
          <div style={{flex: 1}}>
            <label className="text-light" style={{fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Edad</label>
            <input type="text" value={calcularEdad(formData.fechaNacimiento)} disabled style={{backgroundColor: '#f0f0f0'}} />
          </div>
        </div>
        <div>
          <input type="tel" name="telefono" placeholder="Teléfono Particular" value={formData.telefono} onChange={handleChange} required />
        </div>
        {mensaje && <p style={{color: mensaje.includes('Error') ? 'var(--danger)' : 'var(--primary-green)'}}>{mensaje}</p>}
        <button type="submit" className="btn btn-primary">Registrar Usuario</button>
      </form>
    </div>
  );
};

export default RegistroNuevoUsuario;
