import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import TeamTaskApp from './TeamTaskApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeamTaskApp />
  </StrictMode>,
);
