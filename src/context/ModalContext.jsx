import { createContext, useContext, useState, useCallback } from 'react';
import './Modal.css';

const ModalContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert', // 'alert', 'confirm', 'promptLogin'
    title: '',
    message: '',
    resolve: null
  });

  const [promptData, setPromptData] = useState({ user: '', pass: '' });

  const showModal = useCallback(({ type = 'alert', title = 'Atención', message = '' }) => {
    return new Promise((resolve) => {
      setPromptData({ user: '', pass: '' });
      setModalState({
        isOpen: true,
        type,
        title,
        message,
        resolve
      });
    });
  }, []);

  const handleClose = (result) => {
    if (modalState.resolve) {
      if (modalState.type === 'promptLogin') {
        modalState.resolve(result ? promptData : null);
      } else {
        modalState.resolve(result);
      }
    }
    setModalState({ ...modalState, isOpen: false });
  };

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      {modalState.isOpen && (
        <div className="modal-overlay fadeIn">
          <div className="modal-content scaleUp">
            <h3 className="modal-title">{modalState.title}</h3>
            
            {modalState.message && <p className="modal-message">{modalState.message}</p>}

            {modalState.type === 'promptLogin' && (
              <form className="d-flex flex-column gap-3 mb-4 mt-2" autoComplete="off">
                {/* Campos ocultos para engañar a los gestores de contraseñas rebeldes */}
                <input type="text" style={{display: 'none'}} />
                <input type="password" style={{display: 'none'}} />
                
                <input 
                  type="text" 
                  placeholder="Usuario Administrador" 
                  value={promptData.user}
                  onChange={(e) => setPromptData({...promptData, user: e.target.value})}
                  autoComplete="off"
                  data-lpignore="true"
                  autoFocus
                />
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  value={promptData.pass}
                  onChange={(e) => setPromptData({...promptData, pass: e.target.value})}
                  autoComplete="new-password"
                  data-lpignore="true"
                />
              </form>
            )}

            <div className="modal-actions">
              {(modalState.type === 'confirm' || modalState.type === 'promptLogin') && (
                <button className="btn btn-danger" onClick={() => handleClose(false)}>
                  Cancelar
                </button>
              )}
              <button className="btn btn-primary" onClick={() => handleClose(true)}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
