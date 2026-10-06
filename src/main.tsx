import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSmartGuardServiceWorker } from './utils/offlineManager';

// Register Service Worker for offline SCADA diagnostic capability
registerSmartGuardServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
