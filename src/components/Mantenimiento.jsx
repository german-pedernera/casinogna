import { ShieldAlert, LogOut } from 'lucide-react';

const Mantenimiento = ({ onLogout }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0e1e17 0%, #1a3c2f 100%)',
      padding: '20px',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: '550px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '40px 30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        textAlign: 'center',
        color: '#FFFFFF'
      }}>
        {/* Glow effect */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(40, 167, 69, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 25px auto',
          boxShadow: '0 0 30px rgba(40, 167, 69, 0.3)',
          animation: 'pulse 2s infinite alternate'
        }}>
          <ShieldAlert size={50} color="#28a745" />
        </div>

        <h1 style={{
          fontSize: '4.5rem',
          fontWeight: '900',
          margin: '0',
          lineHeight: '1',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #a2bcae 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-2px'
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '1.6rem',
          fontWeight: '700',
          margin: '10px 0 20px 0',
          color: '#28a745',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Sitio en Mantenimiento
        </h2>

        <div style={{
          height: '2px',
          width: '60px',
          background: '#28a745',
          margin: '0 auto 25px auto',
          borderRadius: '1px'
        }}></div>

        <p style={{
          fontSize: '1.1rem',
          lineHeight: '1.6',
          color: '#cdddd5',
          margin: '0 0 30px 0',
          fontWeight: '400'
        }}>
          Disculpe las molestias. El sistema está temporalmente fuera de servicio por tareas de mantenimiento programadas por el administrador.
        </p>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '35px',
          fontSize: '0.9rem',
          color: '#8da69a'
        }}>
          <strong>Aviso del Administrador:</strong> "Página en mantenimiento 404 por el administrador. Por favor, vuelva a intentar más tarde."
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: '50px',
              border: 'none',
              background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
              transition: 'all 0.3s ease',
              width: '100%',
              maxWidth: '250px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
            }}
          >
            <LogOut size={18} />
            Volver al Login
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.96);
            box-shadow: 0 0 20px rgba(40, 167, 69, 0.2);
          }
          100% {
            transform: scale(1.04);
            box-shadow: 0 0 35px rgba(40, 167, 69, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default Mantenimiento;
