# AWS Lab Deployment Tasks

- [x] Task 1: Database Configuration (State & Storage)
  - [x] Provision Amazon ElastiCache (Redis) cluster
  - [x] Update `express-server` and `websocket-server` to use ElastiCache endpoint
  - [x] Provision Amazon DynamoDB `Snippets` table (PK: `SnippetID`)
  - [x] Update Express server to handle DynamoDB storage for snippets
- [x] Task 2: Networking and Security Services Configuration
  - [x] Create IAM Role `CodeEditor-EC2-Role`
  - [x] Remove hardcoded AWS credentials
  - [x] Setup VPC & Subnet Architecture
  - [x] Configure Security Groups (Load Balancer, EC2, Redis)
- [ ] Task 3: High Availability and Scalability Services
  > **Architecture Note:** Switched from Amazon ElastiCache to Docker-based Redis running locally
  > on each EC2 instance (`docker run -d --name redis-server -p 6379:6379 redis:7`).
  > ALB Sticky Sessions keep each user pinned to the same instance so in-memory rooms work correctly.
  - [ ] **A1** Create `Express-TG` target group (port 3000) with sticky sessions
  - [ ] **A2** Create `WebSocket-TG` target group (port 5000) with sticky sessions
  - [ ] **B** Create `CodeEditor-ALB` — Listener 80 to Express-TG, Listener 8080 to WebSocket-TG
  - [ ] **C** Rebuild frontend with `VITE_BACKEND_HOST` = ALB DNS, commit and push
  - [ ] **D** Create Launch Template `CodeEditor-LT` (Ubuntu 24.04, t3.micro, `CodeEditor-EC2-Role`, User Data from `ec2-setup.sh`)
  - [ ] **E** Create Auto Scaling Group `CodeEditor-ASG` (min 1 / max 3, CPU Target Tracking 40%)
  - [ ] **F** Verify Security Group rules (LB-SG: 80, 8080 open; EC2-SG: 3000, 5000 from LB-SG only)
  - [ ] **G** Verify healthy targets in both TGs and test ALB endpoint
