
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add this script to prevent flash of wrong theme
const themeScript = `
  (function() {
    const theme = window.localStorage.getItem('theme') || 'system';
    
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  })();
`;

// Create a script element and insert the theme script
const scriptEl = document.createElement('script');
scriptEl.innerHTML = themeScript;
document.head.appendChild(scriptEl);

createRoot(document.getElementById("root")!).render(<App />);
