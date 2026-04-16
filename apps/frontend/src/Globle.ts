// ── Backend connection config ──────────────────────────────────────────────
// Set these in your Vercel project settings (Project → Settings → Environment Variables)
//
//   VITE_BACKEND_HOST   = CodeEditor-ALB-1911604777.ap-south-1.elb.amazonaws.com
//
// The ALB routes:
//   Port 80   → Express-TG  (HTTP API)
//   Port 8080 → WebSocket-TG (real-time)
//
// For local development leave both unset — falls back to localhost on native ports.

const host = import.meta.env.VITE_BACKEND_HOST;

export const API_URL = host
  ? `http://${host}`          // ALB port 80
  : `http://localhost:3000`;  // local dev direct

export const WS_URL = host
  ? `ws://${host}:8080`       // ALB port 8080
  : `ws://localhost:5000`;    // local dev direct

// Legacy alias — kept for any future references
export const IP_ADDRESS = host ?? "localhost";
