import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import { Download, Trash2, Upload, Search, ChevronLeft, ChevronRight, Edit2, Plus, Save, X } from 'lucide-react';
import './Galeria.css';

const GroupedCard = ({ group, isAdmin, handleDelete, handleDownloadImage, handleEditDescription, handleAddMorePhotos, onPreviewImage }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(group.baseDesc);
  const [uploadingMore, setUploadingMore] = useState(false);
  const fileInputRef = useRef(null);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % group.fotos.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + group.fotos.length) % group.fotos.length);

  const currentFoto = group.fotos[currentIndex];

  // Extraer URL (soporte para formato antiguo JSON o string simple)
  let imgUrl = currentFoto.url;
  try {
    const parsed = JSON.parse(currentFoto.url);
    if (Array.isArray(parsed)) {
      imgUrl = parsed[0];
    }
  } catch {
    imgUrl = currentFoto.url;
  }

  const onSaveEdit = async () => {
    if (editDesc.trim() === '') return;
    await handleEditDescription(group.fotos, editDesc);
    setIsEditing(false);
  };

  const onAddFiles = async (e) => {
    if (e.target.files.length > 0) {
      setUploadingMore(true);
      await handleAddMorePhotos(group.baseDesc, group.fotos, e.target.files);
      setUploadingMore(false);
    }
    e.target.value = null;
  };

  return (
    <div className="card p-2" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', height: '200px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
        <img 
          src={imgUrl} 
          alt={currentFoto.descripcion} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s ease, filter 0.2s ease' }} 
          onClick={() => onPreviewImage(imgUrl, currentFoto.descripcion)}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.03)';
            e.target.style.filter = 'brightness(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1.0)';
            e.target.style.filter = 'brightness(1.0)';
          }}
        />
        {group.fotos.length > 1 && (
          <>
            <button onClick={handlePrev} style={{position: 'absolute', top: '50%', left: '5px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', zIndex: 1}}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNext} style={{position: 'absolute', top: '50%', right: '5px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', zIndex: 1}}>
              <ChevronRight size={20} />
            </button>
            <div style={{position: 'absolute', bottom: '5px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem'}}>
              {currentIndex + 1} / {group.fotos.length}
            </div>
          </>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2">
          <textarea 
            value={editDesc} 
            onChange={(e) => setEditDesc(e.target.value)}
            className="form-control"
            rows="3"
            style={{ width: '100%', resize: 'none', fontSize: '0.9rem' }}
          />
          <div className="d-flex gap-2 mt-2 mb-2">
            <button onClick={onSaveEdit} className="btn btn-success btn-sm flex-grow-1 d-flex justify-content-center align-items-center gap-1"><Save size={14}/> Guardar</button>
            <button onClick={() => { setIsEditing(false); setEditDesc(group.baseDesc); }} className="btn btn-secondary btn-sm flex-grow-1 d-flex justify-content-center align-items-center gap-1"><X size={14}/> Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="mt-2 mb-2 position-relative d-flex justify-content-between align-items-start">
          <p className="text-dark m-0 text-center" style={{fontWeight: '500', fontSize: '0.9rem', minHeight: '40px', flex: 1, paddingRight: '10px'}}>
            {group.baseDesc}
          </p>
          {isAdmin && (
            <button onClick={() => setIsEditing(true)} className="btn btn-light btn-sm p-1 text-primary" style={{border: '1px solid #dee2e6'}} title="Editar texto">
              <Edit2 size={16} />
            </button>
          )}
        </div>
      )}

      <div className="d-flex justify-content-center gap-2 mt-auto flex-wrap">
        <button 
          className="btn btn-primary d-flex justify-content-center align-items-center gap-2" 
          onClick={() => handleDownloadImage(imgUrl, currentFoto.descripcion)}
          style={{padding: '8px 20px', fontSize: '0.85rem'}}
          title="Descargar imagen"
        >
          <Download size={16} /> Descargar
        </button>
        {isAdmin && (
          <>
            <button 
              className="btn btn-success d-flex justify-content-center align-items-center" 
              onClick={() => fileInputRef.current.click()}
              style={{padding: '8px'}}
              title="Añadir más fotos a este grupo"
              disabled={uploadingMore}
            >
              {uploadingMore ? <span className="spinner-border spinner-border-sm"></span> : <Plus size={16} />}
            </button>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={onAddFiles}
            />
            <button 
              className="btn btn-danger d-flex justify-content-center align-items-center" 
              onClick={() => handleDelete(currentFoto.id, currentFoto.fileName)}
              style={{padding: '8px'}}
              title="Eliminar esta fotografía"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const GaleriaFotografica = ({ isAdmin }) => {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const { showModal } = useModal();

  const fetchFotos = async () => {
    try {
      const { data, error } = await supabase.from('galeria').select('*').order('fecha', { ascending: false });
      if (error) throw error;
      setFotos(data || []);
    } catch (error) {
      console.error("Error fetching fotos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFotos();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0 || !descripcion) return;

    setUploading(true);
    
    try {
      // Recorrer todos los archivos seleccionados
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}_${sanitizedName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('galeria')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('galeria')
          .getPublicUrl(fileName);

        // Guardar cada foto individualmente en la base de datos
        const { error: dbError } = await supabase.from('galeria').insert([{
          descripcion: files.length > 1 ? `${descripcion} (${i + 1}/${files.length})` : descripcion,
          url: publicUrl, 
          fileName: fileName,
          fecha: new Date().toISOString()
        }]);

        if (dbError) throw dbError;
      }

      setDescripcion('');
      setFiles([]);
      e.target.reset();
      fetchFotos();
    } catch (error) {
      console.error("Error uploading image:", error);
      showModal({ type: 'alert', title: 'Error', message: 'Hubo un error al subir la fotografía.' });
    } finally {
      setUploading(false);
    }
  };

  const handleEditDescription = async (fotosDelGrupo, nuevaDescripcion) => {
    try {
      const total = fotosDelGrupo.length;
      for (let i = 0; i < total; i++) {
        const foto = fotosDelGrupo[i];
        const newDesc = total > 1 ? `${nuevaDescripcion} (${i + 1}/${total})` : nuevaDescripcion;
        const { error } = await supabase.from('galeria').update({ descripcion: newDesc }).eq('id', foto.id);
        if (error) throw error;
      }
      fetchFotos();
    } catch (error) {
      console.error("Error al editar descripción:", error);
      showModal({ type: 'alert', title: 'Error', message: 'Hubo un error al guardar los cambios.' });
    }
  };

  const handleAddMorePhotos = async (baseDesc, fotosAntiguas, nuevosFiles) => {
    try {
      const totalNuevas = nuevosFiles.length;
      const totalAntiguas = fotosAntiguas.length;
      const totalFinal = totalAntiguas + totalNuevas;

      // 1. Actualizar sufijos de las fotos antiguas para reflejar el nuevo total
      for (let i = 0; i < totalAntiguas; i++) {
        const foto = fotosAntiguas[i];
        const newDesc = `${baseDesc} (${i + 1}/${totalFinal})`;
        await supabase.from('galeria').update({ descripcion: newDesc }).eq('id', foto.id);
      }

      // 2. Subir las fotos nuevas y asignarles la parte restante del sufijo
      for (let i = 0; i < totalNuevas; i++) {
        const file = nuevosFiles[i];
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}_${sanitizedName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('galeria')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('galeria')
          .getPublicUrl(fileName);

        const newDesc = `${baseDesc} (${totalAntiguas + i + 1}/${totalFinal})`;
        
        const { error: dbError } = await supabase.from('galeria').insert([{
          descripcion: newDesc,
          url: publicUrl, 
          fileName: fileName,
          fecha: new Date().toISOString()
        }]);

        if (dbError) throw dbError;
      }

      fetchFotos();
    } catch (error) {
      console.error("Error uploading additional images:", error);
      showModal({ type: 'alert', title: 'Error', message: 'Hubo un error al añadir más fotografías al grupo.' });
    }
  };

  const handleDelete = async (docId, fileName) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Fotografía', 
      message: '¿Está seguro de eliminar esta fotografía de la galería?' 
    });

    if (isConfirmed) {
      try {
        // Manejar tanto si es un array JSON de fotos antiguas o un string simple
        let fileNamesToDelete = [];
        try {
          const parsed = JSON.parse(fileName);
          if (Array.isArray(parsed)) {
            fileNamesToDelete = parsed;
          } else {
            fileNamesToDelete = [fileName];
          }
        } catch {
          fileNamesToDelete = [fileName];
        }

        if (fileNamesToDelete.length > 0 && fileNamesToDelete[0]) {
          await supabase.storage.from('galeria').remove(fileNamesToDelete);
        }

        const { error } = await supabase.from('galeria').delete().eq('id', docId);
        if (error) throw error;
        
        fetchFotos();
      } catch (error) {
        console.error("Error deleting foto:", error);
        showModal({ type: 'alert', title: 'Error', message: 'Hubo un error al eliminar la fotografía.' });
      }
    }
  };

  const handleDownloadImage = async (url, desc) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${desc || 'imagen'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Error al descargar", e);
      window.open(url, '_blank');
    }
  };

  const filteredFotos = fotos.filter(foto => 
    (foto.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFotos = [];
  const groupMap = new Map();

  filteredFotos.forEach(foto => {
    // Buscar si termina en " (x/y)" para agrupar
    const match = foto.descripcion.match(/(.*?)( \(\d+\/\d+\))?$/);
    const baseDesc = match && match[2] ? match[1].trim() : foto.descripcion;

    if (groupMap.has(baseDesc)) {
      groupMap.get(baseDesc).fotos.push(foto);
    } else {
      const newGroup = {
        baseDesc,
        fotos: [foto]
      };
      groupMap.set(baseDesc, newGroup);
      groupedFotos.push(newGroup);
    }
  });

  return (
    <div className="card">
      <h3 className="mb-4">Galería Fotográfica</h3>

      {isAdmin && (
        <form onSubmit={handleUpload} className="card mb-4" style={{ backgroundColor: '#E8F8F5' }}>
          <h4 className="mb-4">Subir Nueva Fotografía</h4>
          <div className="d-flex gap-4 align-items-center" style={{ flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Breve descripción" 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              required 
              style={{ flex: 1, minWidth: '200px' }}
            />
            <input 
              type="file" 
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)} 
              required 
            />
            <button type="submit" className="btn btn-primary d-flex gap-2" disabled={uploading}>
              {uploading ? 'Subiendo...' : <><Upload size={18} /> Subir Foto</>}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar fotografía por descripción..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ paddingLeft: '40px', borderRadius: '8px', border: '1px solid #ccc' }}
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p>Cargando galería...</p>
      ) : groupedFotos.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          {groupedFotos.map((group, idx) => (
            <GroupedCard 
              key={idx} 
              group={group} 
              isAdmin={isAdmin} 
              handleDelete={handleDelete} 
              handleDownloadImage={handleDownloadImage}
              handleEditDescription={handleEditDescription}
              handleAddMorePhotos={handleAddMorePhotos}
              onPreviewImage={(url, desc) => setPreviewImage({ url, desc })}
            />
          ))}
        </div>
      ) : (
        <p className="text-light">No se encontraron fotografías.</p>
      )}

      {previewImage && (
        <div 
          className="modal-overlay fadeIn" 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000000,
            animation: 'fadeIn 0.25s ease-out',
            padding: '20px'
          }}
        >
          <div 
            className="scaleUp" 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '95%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <button 
              onClick={() => setPreviewImage(null)}
              className="lightbox-close-btn"
              style={{
                position: 'absolute',
                top: '-45px',
                right: '-10px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
                outline: 'none',
                padding: '0'
              }}
              title="Cerrar vista previa"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            >
              <X size={20} />
            </button>

            <img 
              src={previewImage.url} 
              alt={previewImage.desc} 
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            />

            <div style={{
              marginTop: '20px',
              color: 'white',
              textAlign: 'center',
              maxWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.8)', color: '#eee' }}>
                {previewImage.desc}
              </p>
              <button 
                className="btn btn-primary d-flex justify-content-center align-items-center gap-2" 
                onClick={() => handleDownloadImage(previewImage.url, previewImage.desc)}
                style={{
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  borderRadius: '30px',
                  boxShadow: '0 4px 15px rgba(23, 162, 184, 0.4)',
                  border: 'none',
                  fontWeight: '600'
                }}
              >
                <Download size={18} /> Descargar Imagen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaleriaFotografica;
