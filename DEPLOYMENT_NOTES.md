# CodeEditor — Deployment Session Memory
> Last updated: 2026-04-17 | Conversation ID: d7129f59-151e-4595-8aa0-fba50e845af1

---

## Project Overview

**Repo:** `https://github.com/tanishqtajne25/CodeEditor-main`  
**Local path:** `d:\cc-project\CodeEditor-main`  
**Type:** Turborepo monorepo (npm workspaces)

### Architecture
```
[Vercel Frontend] ──HTTP:80──► [CodeEditor-ALB] ──► [Express-TG :3000]  ─► EC2 instances
                  ──WS:8080──► [CodeEditor-ALB] ──► [WebSocket-TG :5000] ─► EC2 instances
                                                                               │
                                                              Docker Redis :6379 (local per instance)
                                                              Worker (code execution via Docker)
                                                              S3 + DynamoDB (via IAM role)
```

### Services & Ports
| Service | Port (direct) | ALB Listener | Target Group |
|---------|--------------|--------------|--------------|
| Express API | 3000 | 80 | Express-TG |
| WebSocket | 5000 | 8080 | WebSocket-TG |
| Redis (Docker) | 6379 | — (local only) | — |

---

## AWS Resources Provisioned

| Resource | Name / Value |
|----------|-------------|
| VPC | `CodeEditor-VPC` |
| IAM Role | `CodeEditor-EC2-Role` (EC2 Instance Profile — no hardcoded keys) |
| DynamoDB Table | `Snippets` (PK: `SnippetID`) |
| S3 Bucket | `code-editor-snippets-tanishq` |
| AWS Region | `ap-south-1` (Mumbai) |
| ALB | `CodeEditor-ALB` |
| **ALB DNS** | `CodeEditor-ALB-1911604777.ap-south-1.elb.amazonaws.com` |
| ALB Security Group | `LB-SG` (inbound: 80, 8080 from 0.0.0.0/0) |
| EC2 Security Group | `EC2-SG` (inbound: 3000, 5000 from LB-SG; 22 from your IP) |
| Target Group 1 | `Express-TG` — port 3000 — sticky sessions enabled (lb_cookie, 86400s) |
| Target Group 2 | `WebSocket-TG` — port 5000 — sticky sessions enabled (lb_cookie, 86400s) |

### Task Completion Status
- [x] Task 1: Redis (ElastiCache — later switched to Docker local), DynamoDB
- [x] Task 2: IAM Role, VPC, Subnets, Security Groups
- [ ] **Task 3 IN PROGRESS:** ALB ✅, Target Groups ✅, Launch Template ⏳, ASG ⏳

---

## Code Changes Made (All Committed & Pushed to main)

### 1. `apps/frontend/src/Globle.ts` — Complete rewrite
**Was:** `export const IP_ADDRESS = "43.205.116.182"` (hardcoded EC2 IP)  
**Now:** Exports two smart URL constants based on `VITE_BACKEND_HOST` env var:
```ts
const host = import.meta.env.VITE_BACKEND_HOST;
export const API_URL = host ? `http://${host}` : `http://localhost:3000`;
export const WS_URL  = host ? `ws://${host}:8080` : `ws://localhost:5000`;
export const IP_ADDRESS = host ?? "localhost"; // legacy alias
```
- In production: `API_URL` = `http://ALB-DNS:80`, `WS_URL` = `ws://ALB-DNS:8080`
- In local dev: falls back to direct ports (3000 / 5000)

### 2. `apps/frontend/src/pages/Register.tsx`
- Changed: `import { IP_ADDRESS }` → `import { WS_URL }`
- Changed: `ws://${IP_ADDRESS}:5000?...` → `${WS_URL}?...`

### 3. `apps/frontend/src/pages/CodeEditor.tsx`
- Changed: `import { IP_ADDRESS }` → `import { API_URL }`
- Changed all 4 fetch calls: `http://${IP_ADDRESS}:3000/...` → `${API_URL}/...`
  - `/submit`
  - `/snippets` (POST)
  - `/snippets/${id}` (GET)
  - `/snippets/${id}` (DELETE)

### 4. `apps/worker/src/index.ts` — Docker path fixes
Removed Windows-only `.replace(/\\/g, "/")` from Docker volume mount strings.  
On Ubuntu, `path.resolve()` already returns POSIX paths — the replace was a no-op but fragile.  
Fixed for: **JavaScript**, **Python**, **C++** (the three that had it).

### 5. `apps/express-server/package.json` — Missing dependencies added
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb --workspace=express-server
```
These were used in `index.ts` but missing from `package.json` — caused `tsc` build failure.

### 6. `apps/frontend/.env` — Created (gitignored, local use)
```
VITE_BACKEND_HOST=CodeEditor-ALB-1911604777.ap-south-1.elb.amazonaws.com
```

### 7. `apps/frontend/.env.example` — Created
Self-documenting template showing what to set.

### 8. `ec2-setup.sh` — Fully rewritten
Key changes:
- Uses **Docker Redis** (`redis:7`) instead of ElastiCache — free-tier safe
- `--restart unless-stopped` on the Redis container (survives reboots)
- Writes 3 separate `.env` files (express, websocket, worker) all pointing to `redis://localhost:6379`
- Uses modern Docker GPG keyring (Ubuntu 24.04 compatible)
- **No frontend build steps** — Vercel handles the frontend
- Swap persisted to `/etc/fstab`

---

## Vercel Configuration Required

> The frontend is deployed on Vercel. After any push to main, Vercel auto-rebuilds.

**Go to:** Vercel → Project → Settings → Environment Variables

| Variable | Value | Scope |
|----------|-------|-------|
| `VITE_BACKEND_HOST` | `CodeEditor-ALB-1911604777.ap-south-1.elb.amazonaws.com` | Production |

After adding, trigger a **Redeploy** from the Vercel Deployments tab.

---

## Task 3 — Remaining AWS Console Steps

### Phase D — Launch Template
> EC2 → Launch Templates → Create launch template

| Field | Value |
|-------|-------|
| Name | `CodeEditor-LT` |
| AMI | Ubuntu Server 24.04 LTS (64-bit x86) |
| Instance type | `t3.micro` |
| Key pair | Existing key pair |
| Security group | `EC2-SG` |
| IAM instance profile | `CodeEditor-EC2-Role` |
| User Data | Full contents of `ec2-setup.sh` |

### Phase E — Auto Scaling Group
> EC2 → Auto Scaling Groups → Create

| Field | Value |
|-------|-------|
| Name | `CodeEditor-ASG` |
| Launch template | `CodeEditor-LT` |
| VPC | `CodeEditor-VPC` |
| Subnets | All available |
| Attach TGs | `Express-TG` + `WebSocket-TG` (both) |
| Health check | ELB, grace period 300s |
| Desired / Min / Max | `1 / 1 / 3` |
| Scaling policy | Target Tracking → CPU → **40%** |

### Phase F — Verify Security Groups
- `LB-SG`: inbound 80 + 8080 from `0.0.0.0/0`
- `EC2-SG`: inbound 3000 + 5000 from `LB-SG` only; 22 from your IP

### Phase G — Verification
```bash
# Test Express via ALB
curl http://CodeEditor-ALB-1911604777.ap-south-1.elb.amazonaws.com/

# Demo auto-scaling (SSH into instance, then):
sudo apt-get install -y stress-ng
stress-ng --cpu 2 --timeout 180
# Watch ASG Activity tab — new instance launches within ~2 min
```

---

## Architecture Decision Log

| Decision | Reason |
|----------|--------|
| Docker Redis (local per instance) instead of ElastiCache | Free-tier compliance, lab simplicity |
| ALB Sticky Sessions (lb_cookie) on both TGs | In-memory `rooms` object in websocket-server — sticky sessions ensure all users in a room always hit the same instance |
| Vercel for frontend | Already deployed; no need to serve static files from EC2 |
| IAM Instance Profile for AWS credentials | No hardcoded keys; works automatically on any instance that assumes `CodeEditor-EC2-Role` |
| Port 80 for API, Port 8080 for WebSocket on ALB | Clean separation; avoids path-based routing complexity for WS upgrades |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `ec2-setup.sh` | Paste into Launch Template User Data |
| `apps/frontend/src/Globle.ts` | Central URL config — reads `VITE_BACKEND_HOST` |
| `apps/frontend/.env` | Local dev overrides (gitignored) |
| `apps/frontend/.env.example` | Template for env setup |
| `tasks.md` | AWS deployment checklist |
