# Cyber Sentinel — Frontend Dashboard

![Author](https://img.shields.io/badge/Developed%20by-Abhi%20Sharma-0ea5e9.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg?logo=vite&logoColor=white)

Modern SOC & GRC monitoring dashboard for **Cyber Sentinel**. Provides real-time views of honeypot telemetry, deterministic threat detections, automated risk registers, and compliance gap assessments.

---

## Architecture & Data Flow

```mermaid
flowchart LR
    subgraph UI ["Cyber Sentinel UI"]
        Dashboard["Dashboard View"]
        SOC["Threat & Event Stream"]
        GRC["Risk & Control Registers"]
        AI["Advisory AI Assistant"]
    end

    subgraph Service ["API Client"]
        Axios["Axios Client (JWT Auth)"]
    end

    subgraph Backend ["Backend Services"]
        API["FastAPI REST Endpoints (/api/v1)"]
    end

    Dashboard --> Axios
    SOC --> Axios
    GRC --> Axios
    AI --> Axios
    Axios -->|Proxy / Direct| API
```

---

## Setup & Running

```bash
# Clone the repository
git clone https://github.com/Abhi-Sharma-07/Cyber-Sentinel-Frontend.git
cd Cyber-Sentinel-Frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

---

## Author & Attribution

**Cyber Sentinel Frontend** is designed and developed by **Abhi Sharma**.  
All rights reserved.
