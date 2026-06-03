import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    setIsVisible(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="install-prompt-card">
      <style>
        {`
          .install-prompt-card {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(15, 61, 35, 0.98) 0%, rgba(22, 91, 52, 0.98) 100%);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #ffffff;
            padding: 14px 22px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(15, 61, 35, 0.35);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            z-index: 99999;
            width: 90%;
            max-width: 460px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            animation: installPromptSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-sizing: border-box;
          }

          @keyframes installPromptSlideUp {
            from {
              transform: translate(-50%, 120%);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }

          .install-prompt-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
          }

          .install-prompt-title {
            font-family: 'Outfit', sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #ffffff;
            margin: 0;
            padding: 0;
            line-height: 1.2;
          }

          .install-prompt-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 0.78rem;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            padding: 0;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .install-prompt-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }

          .install-prompt-btn-primary {
            background: #ffffff;
            color: #0f3d23;
            border: none;
            padding: 8px 16px;
            border-radius: 30px;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease-in-out;
            white-space: nowrap;
          }

          .install-prompt-btn-primary:hover {
            background: #eafaf1;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          }

          .install-prompt-btn-primary:active {
            transform: translateY(0);
          }

          .install-prompt-btn-close {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease-in-out;
            padding: 0;
          }

          .install-prompt-btn-close:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
          }

          .install-prompt-btn-close:active {
            transform: scale(0.95);
          }

          @media (max-width: 480px) {
            .install-prompt-card {
              bottom: 16px;
              width: calc(100% - 24px);
              padding: 12px 14px;
              gap: 10px;
              border-radius: 12px;
            }
            
            .install-prompt-title {
              font-size: 0.88rem;
            }
            
            .install-prompt-subtitle {
              font-size: 0.72rem;
              max-width: 140px;
            }
            
            .install-prompt-btn-primary {
              padding: 7px 12px;
              font-size: 0.8rem;
              gap: 4px;
            }
            
            .install-prompt-btn-close {
              width: 28px;
              height: 28px;
            }
          }
        `}
      </style>
      <div className="install-prompt-text">
        <strong className="install-prompt-title">Instalar Aplicación</strong>
        <span className="install-prompt-subtitle">Accede más rápido desde tu inicio</span>
      </div>
      <div className="install-prompt-actions">
        <button 
          onClick={handleInstall}
          className="install-prompt-btn-primary"
        >
          <Download size={15} /> Instalar
        </button>
        <button 
          onClick={handleClose}
          className="install-prompt-btn-close"
          title="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
