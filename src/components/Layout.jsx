import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { Menu, X, LogOut, LayoutDashboard, FileText, Calendar, Image as ImageIcon, Users, FileSpreadsheet, PieChart, Settings, MessageSquare, Eye, EyeOff } from 'lucide-react';
import CambioDeColor from './CambioDeColor';
import './Layout.css';

const Layout = ({ user, onLogout }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showTechSupportModal, setShowTechSupportModal] = useState(false);
  const [showPersonalDataModal, setShowPersonalDataModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [personalFormMsg, setPersonalFormMsg] = useState({ text: '', type: '' });
  const [personalFormData, setPersonalFormData] = useState({
    jerarquia: '',
    nombreApellido: '',
    dni: '',
    ce: '',
    fechaNacimiento: '',
    telefono: '',
    edad: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  const ALL_JERARQUIAS = [
    "Comandante General",
    "Comandante Mayor",
    "Comandante Principal",
    "Comandante",
    "Segundo Comandante",
    "Primer Alférez",
    "Alférez",
    "Subalférez"
  ];

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

  useEffect(() => {
    if (showPersonalDataModal && currentUser?.id) {
      const loadPersonalData = async () => {
        try {
          setIsLoadingData(true);
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          if (error) throw error;
          if (data) {
            setPersonalFormData({
              jerarquia: data.jerarquia || '',
              nombreApellido: data.nombreApellido || '',
              dni: data.dni || '',
              ce: data.ce || '',
              fechaNacimiento: data.fechaNacimiento || '',
              telefono: data.telefono || '',
              edad: data.edad || ''
            });
          }
        } catch (e) {
          console.error("Error al cargar datos personales:", e);
        } finally {
          setIsLoadingData(false);
        }
      };
      loadPersonalData();
    }
  }, [showPersonalDataModal, currentUser?.id]);

  const handleSavePersonalData = async (e) => {
    e.preventDefault();
    if (!personalFormData.nombreApellido || !personalFormData.dni || !personalFormData.ce) {
      setPersonalFormMsg({ text: 'Por favor, complete todos los campos obligatorios.', type: 'danger' });
      return;
    }
    
    try {
      setIsSavingData(true);

      // Validar que el MI (DNI) o CE (Contraseña) no pertenezcan a otro usuario ya registrado
      const { data: existingUsers, error: checkError } = await supabase
        .from('usuarios')
        .select('id, dni, ce')
        .neq('id', currentUser.id)
        .or(`dni.eq.${personalFormData.dni},ce.eq.${personalFormData.ce}`);

      if (checkError) throw checkError;

      if (existingUsers && existingUsers.length > 0) {
        const isMiRegistered = existingUsers.some(u => u.dni === personalFormData.dni);
        if (isMiRegistered) {
          setPersonalFormMsg({ text: 'Error: El MI (Usuario) ya pertenece a otro socio registrado.', type: 'danger' });
        } else {
          setPersonalFormMsg({ text: 'Error: La Contraseña ya pertenece a otro socio registrado.', type: 'danger' });
        }
        setIsSavingData(false);
        return;
      }

      const edad = calcularEdad(personalFormData.fechaNacimiento);
      
      const dataToUpdate = {
        jerarquia: personalFormData.jerarquia,
        nombreApellido: personalFormData.nombreApellido,
        dni: personalFormData.dni,
        ce: personalFormData.ce,
        fechaNacimiento: personalFormData.fechaNacimiento,
        telefono: personalFormData.telefono,
        edad: edad
      };
      
      const { error } = await supabase
        .from('usuarios')
        .update(dataToUpdate)
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      // Actualizar en planilla_mensual si el nombre o jerarquía cambió
      if (currentUser.name !== personalFormData.nombreApellido || currentUser.rank !== personalFormData.jerarquia) {
        const { error: PMError } = await supabase
          .from('planilla_mensual')
          .update({ 
            socio: personalFormData.nombreApellido,
            jerarquia: personalFormData.jerarquia 
          })
          .eq('socio', currentUser.name);
        if (PMError) console.error("Error al actualizar planilla mensual:", PMError);
      }
      
      // Actualizar local state
      const updated = { 
        ...currentUser, 
        name: personalFormData.nombreApellido, 
        rank: personalFormData.jerarquia,
        dni: personalFormData.dni
      };
      setCurrentUser(updated);
      
      setPersonalFormMsg({ text: '¡Datos actualizados correctamente!', type: 'success' });
      
      setTimeout(() => {
        setShowPersonalDataModal(false);
        setPersonalFormMsg({ text: '', type: '' });
      }, 1500);
    } catch (err) {
      console.error("Error al guardar datos personales:", err);
      setPersonalFormMsg({ text: 'Error al actualizar los datos en la base de datos.', type: 'danger' });
    } finally {
      setIsSavingData(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 1.5 seconds entrance loader
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const roomOne = supabase.channel('online-users', {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });

    roomOne
      .on('presence', { event: 'sync' }, () => {
        const newState = roomOne.presenceState();
        const activeCount = Object.keys(newState).length;
        setOnlineCount(Math.max(1, activeCount));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomOne.track({
            user: currentUser?.name || 'Guest',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(roomOne);
    };
  }, [currentUser]);

  const handleLogout = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      onLogout();
      navigate('/');
    }, 1500); // 1.5 seconds exit loader
  };

  const navLinks = [
    { path: '/panel', label: 'Panel Principal', icon: <LayoutDashboard size={20} />, roles: ['user', 'admin'] },
    { path: '/planilla', label: 'Planilla Mensual', icon: <Calendar size={20} />, roles: ['user', 'admin'] },
    { path: '/balance', label: 'Balance Ingreso / Egreso', icon: <FileSpreadsheet size={20} />, roles: ['user', 'admin'] },
    { path: '/documentacion', label: 'Documentación Gastos', icon: <FileText size={20} />, roles: ['user', 'admin'] },
    { path: '/galeria', label: 'Galería Fotográfica', icon: <ImageIcon size={20} />, roles: ['user', 'admin'] },
    { path: '/socios', label: 'Fecha de Cumpleaños', icon: <Users size={20} />, roles: ['user', 'admin'] },
    { path: '/estadisticas', label: 'Estadísticas', icon: <PieChart size={20} />, roles: ['user', 'admin'] },
    { path: '/admin', label: 'Panel de Control', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  ];

  const allowedLinks = navLinks.filter(link => link.roles.includes(currentUser?.role));

  return (
    <>
      <div className={`layout-container ${isExiting ? 'layout-exit' : 'layout-enter'}`}>
      {/* Navbar Mobile/Desktop */}
      <nav className="navbar">
        <Link to="/panel" className="navbar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="circle-logo-small"></div>
          <span className="navbar-title">Casino Oficiales</span>
        </Link>
        
        <div className="navbar-user d-flex align-items-center">
          <span className="d-none-mobile" style={{ color: '#17a2b8', fontWeight: '500', marginRight: '20px', fontSize: '0.9rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#28a745', marginRight: '6px' }}></span>
            Oficiales conectados: <strong>{onlineCount}</strong>
          </span>
          <span className="user-info d-none-mobile">
            {currentUser?.role === 'admin' && <span style={{ color: '#ffc107', marginRight: '5px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ffc107', padding: '2px 5px', borderRadius: '4px' }}>ADMIN</span>}
            {currentUser?.rank && <b>{currentUser.rank}</b>} {currentUser?.name}
          </span>
          
          {/* Settings Menu Dropdown Container */}
          <div className="settings-menu-container">
            <Settings 
              size={22} 
              className="settings-icon-btn" 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
              title="Configuración"
              style={{
                transform: isSettingsOpen ? 'rotate(45deg)' : 'rotate(0deg)'
              }}
            />
            {isSettingsOpen && (
              <div className="settings-dropdown" style={{ minWidth: '220px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-dark)', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', paddingBottom: '8px', textAlign: 'left' }}>
                  Configuración
                </h5>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', padding: '4px 0' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dark)' }}>Modo Oscuro</span>
                  <CambioDeColor />
                </div>
                {currentUser?.role === 'user' && (
                  <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', paddingTop: '8px' }}>
                    <button 
                      onClick={() => {
                        setShowPersonalDataModal(true);
                        setIsSettingsOpen(false);
                      }}
                      className="settings-action-btn"
                    >
                      <Users size={18} style={{ color: 'var(--primary-color)' }} />
                      <span>Editar Datos Personales</span>
                    </button>
                  </div>
                )}
                <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', paddingTop: '8px' }}>
                  <button 
                    onClick={() => {
                      setShowTechSupportModal(true);
                      setIsSettingsOpen(false);
                    }}
                    className="settings-action-btn"
                  >
                    <MessageSquare size={18} style={{ color: 'var(--primary-color)' }} />
                    <span>Servicio Técnico 24/7</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="menu-toggle btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-mobile-header mobile-only">
            <div className="d-flex justify-content-between align-items-center w-100 mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="circle-logo-small" style={{ border: '2px solid rgba(255, 255, 255, 0.2)' }}></div>
                <span className="navbar-title" style={{ color: 'white', fontSize: '1.2rem' }}>Casino Oficiales</span>
              </div>
              <button 
                className="btn" 
                style={{ color: 'white', padding: '8px', background: 'none', border: 'none' }} 
                onClick={() => setIsMenuOpen(false)}
                title="Cerrar menú"
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ paddingTop: '10px' }}>
              <span className="user-info" style={{ color: 'white' }}>
                {currentUser?.role === 'admin' && <span style={{ color: '#ffc107', marginRight: '5px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ffc107', padding: '2px 5px', borderRadius: '4px', display: 'inline-block', marginBottom: '5px' }}>ADMIN</span>}<br/>
                {currentUser?.rank && <b>{currentUser.rank}</b>} {currentUser?.name}
              </span>
              <p style={{ color: '#17a2b8', fontWeight: '500', fontSize: '0.85rem', marginTop: '10px', marginBottom: 0 }}>
                Personas conectadas: {onlineCount}
              </p>
            </div>
          </div>
          <ul className="nav-list">
            {allowedLinks.map((link) => (
              <li key={link.path} className="nav-item">
                <Link 
                  to={link.path} 
                  className={`animated-button ${location.pathname === link.path ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="arr-2">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                  <span className="text">
                    {link.icon}
                    <span>{link.label}</span>
                  </span>
                  <span className="circle"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="arr-1">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                </Link>
              </li>
            ))}
            <li className="nav-item mt-4">
              <button className="animated-button btn-logout" onClick={handleLogout}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="arr-2">
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="text">
                  <LogOut size={20} />
                  <span>Salir de la aplicación</span>
                </span>
                <span className="circle"></span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="arr-1">
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
              </button>
            </li>
          </ul>
        </aside>

        {/* Content */}
        <main className="content">
          <Outlet context={{ onlineCount }} />
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)}></div>
      )}

      {/* Botón flotante de WhatsApp */}
      <a 
        href="https://chat.whatsapp.com/GRAhacEZeOiLGvpFQb3iKO?s=cl&p=a&mlu=0" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-float"
        title="Unirse al grupo de Oficiales"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>

      {/* Modal de Servicio Técnico */}
      {showTechSupportModal && (
        <div 
          className="modal-overlay fadeIn" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '100px',
            zIndex: 100000,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div 
            className="modal-content scaleUp" 
            style={{
              background: 'var(--white, #fff)',
              borderRadius: '20px',
              padding: '28px',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color, #eee)',
              position: 'relative',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <h3 
              style={{ 
                margin: '0 0 16px 0', 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MessageSquare size={22} className="text-primary" />
              Servicio Técnico 24/7
            </h3>

            <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Usted se está comunicando con el soporte técnico de Casino Oficiales. ¿Desea iniciar una conversación de ayuda vía WhatsApp?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowTechSupportModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <a 
                href="https://wa.me/5493755685514?text=Hola,%20necesito%20soporte%20técnico%20para%20la%20aplicación%20de%20Casino%20de%20Oficiales."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success"
                onClick={() => setShowTechSupportModal(false)}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none'
                }}
              >
                Iniciar Chat
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Datos Personales */}
      {showPersonalDataModal && (
        <div 
          className="modal-overlay fadeIn" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '60px',
            zIndex: 100000,
            animation: 'fadeIn 0.3s ease-out',
            overflowY: 'auto'
          }}
        >
          <div 
            className="modal-content scaleUp" 
            style={{
              background: 'var(--white, #fff)',
              borderRadius: '20px',
              padding: '28px',
              width: '90%',
              maxWidth: '460px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color, #eee)',
              position: 'relative',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              marginBottom: '60px'
            }}
          >
            <h3 
              style={{ 
                margin: '0 0 16px 0', 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Users size={22} className="text-primary" />
              Editar Datos Personales
            </h3>

            {isLoadingData ? (
              <p style={{ color: 'var(--text-dark)' }}>Cargando tus datos desde la base de datos...</p>
            ) : (
              <form onSubmit={handleSavePersonalData} className="d-flex flex-column gap-3" autoComplete="off">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Jerarquía</label>
                  <select 
                    value={personalFormData.jerarquia} 
                    onChange={(e) => setPersonalFormData({...personalFormData, jerarquia: e.target.value})} 
                    required
                  >
                    <option value="">Seleccione Jerarquía...</option>
                    {ALL_JERARQUIAS.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Nombre y Apellido</label>
                  <input 
                    type="text" 
                    placeholder="Nombre y Apellido" 
                    value={personalFormData.nombreApellido} 
                    readOnly 
                    style={{ opacity: 0.7, cursor: 'default' }}
                  />
                </div>

                <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Usuario (MI)</label>
                    <input 
                      type="text" 
                      placeholder="DNI" 
                      value={personalFormData.dni} 
                      readOnly 
                      style={{ opacity: 0.7, cursor: 'default' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Contraseña</label>
                    <input 
                      type={showFormPassword ? "text" : "password"} 
                      placeholder="Contraseña" 
                      value={personalFormData.ce} 
                      onChange={(e) => setPersonalFormData({...personalFormData, ce: e.target.value.replace(/\s/g, '')})} 
                      required 
                      style={{ paddingRight: '40px' }}
                    />
                    <div 
                      className="position-absolute" 
                      style={{ right: '12px', top: '38px', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center' }}
                      onClick={() => setShowFormPassword(!showFormPassword)}
                    >
                      {showFormPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-center" style={{ flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Fecha de Nacimiento</label>
                    <input 
                      type="date" 
                      value={personalFormData.fechaNacimiento} 
                      onChange={(e) => setPersonalFormData({...personalFormData, fechaNacimiento: e.target.value})} 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Edad</label>
                    <input 
                      type="text" 
                      value={calcularEdad(personalFormData.fechaNacimiento)} 
                      disabled 
                      style={{ backgroundColor: '#f0f0f0' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Teléfono Particular</label>
                  <input 
                    type="tel" 
                    placeholder="Teléfono" 
                    value={personalFormData.telefono} 
                    onChange={(e) => setPersonalFormData({...personalFormData, telefono: e.target.value})} 
                    required 
                  />
                </div>

                {personalFormMsg.text && (
                  <p style={{ color: personalFormMsg.type === 'danger' ? 'var(--danger)' : 'var(--primary-green)', margin: 0, fontWeight: '600' }}>
                    {personalFormMsg.text}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowPersonalDataModal(false);
                      setPersonalFormMsg({ text: '', type: '' });
                    }}
                    style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}
                    disabled={isSavingData}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}
                    disabled={isSavingData}
                  >
                    {isSavingData ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Pantalla de carga con cubo 3D giratorio (andrew-demchenk0) */}
    {(isLoading || isExiting) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0b0f19',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          gap: '40px'
        }}>
          <img src="/gendarmeria_nacional_escudo.png" alt="Cargando..." className="image-loader" />
          <span style={{
            color: 'hsl(176.83, 83.02%, 55.29%)',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: '700',
            fontSize: '1.2rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            animation: 'slowFadeIn 1.5s ease-in-out infinite alternate'
          }}>
            {isExiting ? "Salir de la aplicación" : "Cargando..."}
          </span>
        </div>
      )}
    </>
  );
};

export default Layout;
