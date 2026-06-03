import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useOutletContext } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';


const PanelPrincipal = ({ user }) => {
  const { onlineCount } = useOutletContext() || { onlineCount: 1 };
  const [propuesta, setPropuesta] = useState('');
  const [mi, setMi] = useState('');
  const [ce, setCe] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [propuestas, setPropuestas] = useState([]);
  const [loadingPropuestas, setLoadingPropuestas] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [totalSocios, setTotalSocios] = useState(0);

  const fetchTotalSocios = async () => {
    try {
      const { count, error } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .neq('dni', 'SISTEMA_CONFIG');
      
      if (error) throw error;
      setTotalSocios(count || 0);
    } catch (error) {
      console.error("Error fetching total socios:", error);
    }
  };

  const fetchPropuestas = async () => {
    try {
      const { data, error } = await supabase
        .from('propuestas')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      setPropuestas(data || []);
    } catch (error) {
      console.error("Error fetching propuestas:", error);
    } finally {
      setLoadingPropuestas(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPropuestas();
    fetchTotalSocios();
  }, []);

  const handleEnviarPropuesta = async (e) => {
    e.preventDefault();
    if (!propuesta || !mi || !ce) {
      setMensaje('Por favor, complete todos los campos.');
      return;
    }

    try {
      setEnviando(true);

      const { error } = await supabase.from('propuestas').insert([{
        mi: mi,
        ce: ce,
        propuesta: propuesta,
        fecha: new Date().toISOString(),
        jerarquia: user?.rank || 'N/A',
        nombre: user?.name || 'Usuario',
        votos: []
      }]);
      if (error) throw error;

      setPropuesta('');
      setMi('');
      setCe('');
      setMensaje('¡Propuesta enviada exitosamente!');
      fetchPropuestas();
      
      setTimeout(() => setMensaje(''), 5000);
    } catch (error) {
      console.error('Error al enviar propuesta:', error);
      setMensaje('Hubo un error al enviar la propuesta.');
    } finally {
      setEnviando(false);
    }
  };

  const handleVote = async (propuestaId, currentVotos, tipoVoto) => {
    // Usamos el nombre del usuario como identificador único para los votos 
    // (idealmente sería el MI si lo tuviéramos global, pero el name sirve para control de socios)
    const userId = user?.name || 'Anonimo'; 
    
    let votosArray = [];
    try {
      if (typeof currentVotos === 'string') {
        votosArray = JSON.parse(currentVotos);
      } else if (Array.isArray(currentVotos)) {
        votosArray = currentVotos;
      }
    } catch {
      votosArray = [];
    }

    // Convertir votos antiguos a formato objeto si es necesario
    const normalizedVotos = votosArray.map(v => 
      typeof v === 'string' ? { userId: v, voto: 'acuerdo' } : v
    );

    const yaVoto = normalizedVotos.find(v => v.userId === userId);
    if (yaVoto) {
      alert("Ya has votado por esta propuesta.");
      return;
    }

    const nuevosVotos = [...normalizedVotos, { userId, voto: tipoVoto }];

    try {
      const { error } = await supabase
        .from('propuestas')
        .update({ votos: nuevosVotos })
        .eq('id', propuestaId);

      if (error) throw error;
      
      // Actualizar estado local
      setPropuestas(propuestas.map(p => 
        p.id === propuestaId ? { ...p, votos: nuevosVotos } : p
      ));
    } catch (error) {
      console.error("Error al votar:", error);
      alert("Hubo un error al registrar tu voto.");
    }
  };

  const handleDeletePropuesta = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta propuesta?")) return;
    
    try {
      const { error } = await supabase.from('propuestas').delete().eq('id', id);
      if (error) throw error;
      setPropuestas(propuestas.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error al eliminar propuesta:", error);
      alert("Hubo un error al eliminar la propuesta.");
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4">Panel Principal</h2>
      
      <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary-green)' }}>
        <h3>Bienvenido/a al Casino de Oficiales, {user?.rank} {user?.name}</h3>
        <p className="mt-3" style={{ fontSize: '1.05rem', color: '#444', lineHeight: '1.5' }}>
          Nos enorgullece recibirte en este espacio exclusivo diseñado para nuestros socios. Aquí podrás participar activamente enviando tus propuestas, acceder a documentación importante, revisar estados de cuenta y mantenerte informado sobre las novedades de nuestro Escuadrón. <strong>¡Tu participación y compromiso son fundamentales para seguir creciendo juntos!</strong>
        </p>
        <div className="d-flex align-items-center mt-3 p-2 rounded" style={{ backgroundColor: '#e8f4f0', display: 'inline-block', width: 'fit-content' }}>
          <span style={{ color: 'var(--primary-green)', fontWeight: '600' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#28a745', marginRight: '8px' }}></span>
            Oficiales conectados en este momento: <strong>{onlineCount}</strong>
          </span>
        </div>
      </div>

      <div className="card mb-4" style={{ borderLeft: '4px solid var(--accent-color)' }}>
        <h3>Datos para el Abono Mensual</h3>
        <p className="mt-2 text-light" style={{ fontSize: '0.95rem' }}>
          Realice su abono mensual del Casino de Oficiales a la siguiente cuenta bancaria:
        </p>
        <div className="mt-3 p-3" style={{ backgroundColor: '#fdfdfd', borderRadius: '8px', border: '1px solid #eaeded' }}>
          <p className="mb-2"><strong>Titular:</strong> German Andres Ramirez Pedernera</p>
          <p className="mb-2"><strong>Alias:</strong> <span style={{ backgroundColor: '#e8f4f0', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: 'var(--primary-green)' }}>profepedernera</span></p>
          <p className="mb-2"><strong>CBU:</strong> 1430001713020634460010</p>
          <p className="mb-0"><strong>NRO. CUENTA:</strong> 1302063446001</p>
        </div>
      </div>

      <div className="card mb-4">
        <h3>Buzón de Propuestas</h3>
        <p className="text-light mb-4">Deje su mensaje o propuesta para ser evaluada por los integrantes del casino.</p>
        
        <form onSubmit={handleEnviarPropuesta} autoComplete="off" className="d-flex flex-column gap-4">
          <div>
            <textarea
              placeholder="Escriba su propuesta aquí..."
              value={propuesta}
              onChange={(e) => setPropuesta(e.target.value)}
              rows={4}
              maxLength={250}
              required
            ></textarea>
            <div className="text-end" style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>
              {propuesta.length}/250 caracteres
            </div>
          </div>
          <div className="d-flex gap-4 flex-column-mobile">
            <input
              type="text"
              placeholder="Ingrese su MI"
              value={mi}
              onChange={(e) => setMi(e.target.value)}
              required
              autoComplete="none"
            />
            <input
              type="password"
              placeholder="Ingrese su Contraseña"
              value={ce}
              onChange={(e) => setCe(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {mensaje && <p className={mensaje.includes('error') ? 'text-danger' : 'text-success'} style={{color: mensaje.includes('error') ? 'var(--danger)' : 'var(--primary-green)'}}>{mensaje}</p>}
          <button type="submit" className="btn btn-primary btn-mobile-full" style={{alignSelf: 'flex-start'}} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar Propuesta'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="mb-4">Propuestas de los Socios</h3>
        {loadingPropuestas ? (
          <p className="text-light">Cargando propuestas...</p>
        ) : propuestas.length === 0 ? (
          <p className="text-light">Aún no hay propuestas enviadas.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {propuestas.map(p => {
              let votos = [];
              try {
                if (typeof p.votos === 'string') votos = JSON.parse(p.votos);
                else if (Array.isArray(p.votos)) votos = p.votos;
              } catch { votos = []; }

              const normalizedVotos = votos.map(v => 
                typeof v === 'string' ? { userId: v, voto: 'acuerdo' } : v
              );

              const userId = user?.name || 'Anonimo';
              const votoUsuario = normalizedVotos.find(v => v.userId === userId);
              const yaVoto = !!votoUsuario;

              const votosAcuerdo = normalizedVotos.filter(v => v.voto === 'acuerdo').length;
              const votosDesacuerdo = normalizedVotos.filter(v => v.voto === 'desacuerdo').length;
              const totalVotos = votosAcuerdo + votosDesacuerdo;
              
              // Evitar error si no hay socios cargados
              const countSocios = totalSocios > 0 ? totalSocios : totalVotos || 1;
              const pendientes = Math.max(0, countSocios - totalVotos);

              const dataPie = [
                { name: 'De acuerdo', value: votosAcuerdo, color: '#28a745' },
                { name: 'En desacuerdo', value: votosDesacuerdo, color: '#dc3545' },
                { name: 'Pendiente', value: pendientes, color: '#e9ecef' }
              ];

              return (
                <div key={p.id} className="p-3" style={{ border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9fcfb' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>{p.jerarquia} {p.nombre}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {new Date(p.fecha).toLocaleDateString()} a las {new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeletePropuesta(p.id)}
                        className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                        style={{ padding: '6px' }}
                        title="Eliminar Propuesta"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p style={{ color: '#333', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{p.propuesta}</p>
                  
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 flex-column-mobile">
                    <div className="d-flex align-items-stretch gap-2 flex-column-mobile w-100">
                      <button 
                        onClick={() => handleVote(p.id, p.votos, 'acuerdo')}
                        className="btn btn-sm d-flex align-items-center justify-content-center gap-2 btn-mobile-full"
                        style={{ 
                          cursor: yaVoto ? 'default' : 'pointer',
                          backgroundColor: votoUsuario?.voto === 'acuerdo' ? '#e8f4f0' : 'transparent',
                          border: votoUsuario?.voto === 'acuerdo' ? '1px solid var(--primary-green)' : '1px solid #ccc',
                          color: '#090909'
                        }}
                        disabled={yaVoto}
                      >
                        <ThumbsUp size={16} fill={votoUsuario?.voto === 'acuerdo' ? 'var(--primary-green)' : 'none'} color="var(--primary-green)" />
                        <span style={{ fontWeight: 'bold' }}>Estoy de acuerdo ({votosAcuerdo})</span>
                      </button>

                      <button 
                        onClick={() => handleVote(p.id, p.votos, 'desacuerdo')}
                        className="btn btn-sm d-flex align-items-center justify-content-center gap-2 btn-mobile-full"
                        style={{ 
                          cursor: yaVoto ? 'default' : 'pointer',
                          backgroundColor: votoUsuario?.voto === 'desacuerdo' ? '#fdf2f2' : 'transparent',
                          border: votoUsuario?.voto === 'desacuerdo' ? '1px solid var(--danger)' : '1px solid #ccc',
                          color: '#090909'
                        }}
                        disabled={yaVoto}
                      >
                        <ThumbsDown size={16} fill={votoUsuario?.voto === 'desacuerdo' ? 'var(--danger)' : 'none'} color="var(--danger)" />
                        <span style={{ fontWeight: 'bold' }}>No estoy de acuerdo ({votosDesacuerdo})</span>
                      </button>
                      
                      {yaVoto && <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold' }}>¡Gracias por votar!</span>}
                    </div>

                    <div className="d-flex align-items-center justify-content-center w-100 mt-2">
                      <PieChart width={80} height={80}>
                        <Pie
                          data={dataPie}
                          innerRadius={25}
                          outerRadius={35}
                          dataKey="value"
                          stroke="none"
                        >
                          {dataPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', color: '#333' }} itemStyle={{ padding: 0, color: '#333' }} />
                      </PieChart>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelPrincipal;
