// ── Backend connection config ──────────────────────────────────────────────
// Set these in your Vercel project settings (Project → Settings → Environment Variables)
//
// Option A — Direct EC2 IP (no ALB, no SSL):
//   VITE_API_URL   = http://65.2.170.124:3000
//   VITE_WS_URL    = ws://65.2.170.124:5000
//
// Option B — ALB with SSL (production):
//   VITE_API_URL   = https://<alb-dns>
//   VITE_WS_URL    = wss://<alb-dns>:8080
//
// For local development leave both unset — falls back to localhost on native ports.
//
// IMPORTANT: Vercel deploys over HTTPS. Browsers block http:// and ws:// requests
// from an https:// page (mixed content). For Option A to work you must either:
//   • Open the EC2 URL directly in a browser tab first and accept the connection, OR
//   • Use Option B (ALB + SSL certificate).

export const API_URL = import.meta.env.VITE_API_URL ?? `http://localhost:3000`;
export const WS_URL  = import.meta.env.VITE_WS_URL  ?? `ws://localhost:5000`;

// Legacy alias
export const IP_ADDRESS = import.meta.env.VITE_API_URL ?? "localhost";
