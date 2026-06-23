/**
 * Centralized API configuration for SwarmAnalyst landing page frontend.
 * Resolves the correct backend URL dynamically using environment variables,
 * falling back to localhost for local development and desktop Tauri packaging.
 */

const getBackendUrls = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (envUrl) {
    const trimmed = envUrl.trim();
    const cleaned = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    
    // Automatically match WebSocket protocol with HTTP protocol
    let wsUrl = '';
    if (cleaned.startsWith('https://')) {
      wsUrl = cleaned.replace('https://', 'wss://') + '/ws/swarm';
    } else if (cleaned.startsWith('http://')) {
      wsUrl = cleaned.replace('http://', 'ws://') + '/ws/swarm';
    } else {
      wsUrl = `wss://${cleaned}/ws/swarm`;
    }
    
    return {
      API_BASE_URL: cleaned,
      WS_BASE_URL: wsUrl
    };
  }
  
  // Local default (used by Tauri sidecar and local dev environment)
  return {
    API_BASE_URL: 'http://127.0.0.1:8002',
    WS_BASE_URL: 'ws://127.0.0.1:8002/ws/swarm'
  };
};

export const { API_BASE_URL, WS_BASE_URL } = getBackendUrls();
