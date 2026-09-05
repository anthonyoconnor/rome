import { createRoot } from 'react-dom/client';
import Game from './game/Game';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<Game />);
