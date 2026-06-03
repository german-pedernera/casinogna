import { useState, useEffect } from 'react';

const CambioDeColor = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="toggle-container">
      <input 
        className="toggle-input" 
        type="checkbox" 
        checked={isDark}
        onChange={(e) => setIsDark(e.target.checked)}
      />
      <svg className="toggle" viewBox="0 0 292 142" xmlns="http://www.w3.org/2000/svg">
        <path className="toggle-background" d="M71 142C31.7878 142 0 110.212 0 71C0 31.7878 31.7878 0 71 0C110.212 0 119 30 146 30C173 30 182 0 221 0C260 0 292 31.7878 292 71C292 110.212 260.212 142 221 142C181.788 142 173 112 146 112C119 112 110.212 142 71 142Z" />
        
        {/* Gooey effect group */}
        <g filter="url('#goo')">
          <rect className="toggle-circle-center" x="13" y="42" width="116" height="58" rx="29" fill="#fff"/>
          <rect className="toggle-circle left" x="14" y="14" width="114" height="114" rx="58" fill="#fff" />
          <rect className="toggle-circle right" x="164" y="14" width="114" height="114" rx="58" fill="#fff" />
        </g>
        
        {/* Sun Icon (Off / Light) centered at (71, 71) */}
        <path className="toggle-icon off" d="M71 50a21 21 0 1 0 0 42 21 21 0 0 0 0-42zm0-10a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0v-4a4 4 0 0 1 4-4zm0 64a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0v-4a4 4 0 0 1 4-4zm-30-30a4 4 0 0 1 4-4h4a4 4 0 0 1 0 8h-4a4 4 0 0 1-4-4zm64 0a4 4 0 0 1 4-4h4a4 4 0 0 1 0 8h-4a4 4 0 0 1-4-4zm-48-22a4 4 0 0 1 5.66 0l2.83 2.83a4 4 0 1 1-5.66 5.66L54.2 56.8a4 4 0 0 1 0-5.66zm33.94 33.94a4 4 0 0 1 5.66 0l2.83 2.83a4 4 0 0 1-5.66 5.66l-2.83-2.83a4 4 0 0 1 0-5.66zm-33.94 0a4 4 0 0 1 0 5.66l-2.83 2.83a4 4 0 0 1-5.66-5.66l2.83-2.83a4 4 0 0 1 5.66 0zm33.94-33.94a4 4 0 0 1 0 5.66l-2.83 2.83a4 4 0 0 1-5.66-5.66l2.83-2.83a4 4 0 0 1 5.66 0z"/>
        
        {/* Moon Icon (On / Dark) centered at (221, 71) */}
        <path className="toggle-icon on" d="M228.5 50a25 25 0 0 0-21.5 37.8 25 25 0 1 1 34.3-34.3 25 25 0 0 0-12.8-3.5z"/>
      </svg>
      
      {/* SVG gooey filter definition, invisible */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default CambioDeColor;
