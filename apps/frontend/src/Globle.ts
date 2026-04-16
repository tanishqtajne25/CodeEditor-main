// In production: set VITE_BACKEND_HOST to your ALB DNS name (no protocol, no trailing slash)
// e.g. VITE_BACKEND_HOST=my-alb-1234567890.ap-south-1.elb.amazonaws.com
// Leave unset for local development (falls back to localhost)
export const IP_ADDRESS = import.meta.env.VITE_BACKEND_HOST ?? "localhost";
