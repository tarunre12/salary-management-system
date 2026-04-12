# Salary Management System

A full-stack Salary Management System built using React (Vite) and Node.js. This application is completely containerized with Docker, uses Docker Compose for orchestration, and includes a comprehensive Jenkins CI/CD pipeline for deploying to an AWS EC2 instance.

## Architecture & Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Key Libraries:** 
  - `react-router-dom` for routing
  - `@fullcalendar` packages for calendar integration
  - `jspdf` & `jspdf-autotable` for PDF exports
  - `axios` for HTTP requests
- **Containerization:** Multi-stage Docker build utilizing `node:20-alpine` for building and `nginx:alpine` for serving static files on port `80`.

### Backend
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens) & `bcryptjs` for password hashing
- **Containerization:** Node 18 Alpine Docker image running on port `5000`.

### DevOps & Infrastructure
- **CI/CD:** Jenkins (`Jenkinsfile`) Pipeline configuration.
- **Code Quality:** SonarQube Scanner.
- **Registry:** Docker Hub.
- **Hosting:** AWS EC2 Instance (Ubuntu/Linux).
- **Orchestration:** `docker-compose` to run frontend and backend containers together seamlessly.

---

## Getting Started Locally

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (if running without Docker)
- A MongoDB cluster/instance

### Running with Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd Salary-Management-System
   ```

2. **Configure Environment Variables:**
   You can update the environment block for the backend inside the `.env` or `docker-compose.yml`. Make sure variables like `MONGO_URI` and `JWT_SECRET` are correctly set.

3. **Spin up the containers:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - Frontend: `http://localhost:80`
   - Backend API: `http://localhost:5000`

---

## Jenkins CI/CD Pipeline

The project includes a robust `Jenkinsfile` automated for Windows-based Jenkins nodes. The pipeline steps involve:
1. **Checkout:** Clones the codebase from the repository.
2. **SonarQube Analysis:** Runs code analysis on both Frontend and Backend directories.
3. **Unit Testing:** Placeholder for test executions (`npm install` run sequentially).
4. **Build Docker Images:** Builds the frontend and backend Docker images locally on the Jenkins runner.
5. **Push to Docker Hub:** Authenticates via Jenkins credentials and pushes the newly built images to your Docker Hub repository.
6. **Deploy to AWS EC2:**
   - Dynamically generates a production `.env` file that gets passed onto the EC2 instance via SCP.
   - Adjusts Windows OpenSSH key permissions safely.
   - Connects to the AWS EC2 instance over SSH, fetches the latest `docker-compose.yml`, pulls the newest Docker images, and restarts the containers using `docker-compose up -d`.

---

## Repository Structure

```text
├── Backend/                 # Node.js Express backend API
│   ├── Dockerfile           # Backend Docker container definitions
│   ├── index.js             # Entrypoint
│   └── package.json         
├── Frontend/                # React Vite application
│   ├── Dockerfile           # Frontend NGINX multi-stage container
│   ├── nginx.conf           # Custom NGINX config for React Router
│   └── package.json         
├── docker-compose.yml       # Docker compose orchestration
└── Jenkinsfile              # Jenkins deployment pipeline
```
