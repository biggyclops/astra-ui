# Astra UI

**Astra UI is a full-stack control and observability dashboard for a distributed local AI, compute, media, and robotics environment.**

It brings node health, remote-system metrics, service checks, media access, jobs, and operator controls into one interface. The project is built around modular APIs so new compute nodes, storage systems, AI services, and physical devices can be added without redesigning the frontend.

## What it demonstrates

- Distributed system monitoring
- Linux service integration
- Tailscale-based node reachability checks
- Remote CPU, memory, disk, and Docker metrics over SSH
- Service health probes
- NAS/media integration with ranged streaming support
- React + TypeScript frontend engineering
- Express + TypeScript API development
- Shared frontend/backend contracts and validation
- PostgreSQL / Drizzle data modeling
- System diagnostics and fault isolation
- Modular architecture designed for AI and robotics expansion

## Architecture

```mermaid
flowchart LR
    UI["Astra UI\nReact + TypeScript"] --> API["Astra API\nExpress + TypeScript"]
    API --> STATUS["Status / Diagnostics"]
    API --> JOBS["Jobs / Control"]
    API --> MEDIA["Media Services"]
    API --> DATA["PostgreSQL / Drizzle"]

    STATUS --> LOCAL["Local Host\nLinux metrics + services"]
    STATUS --> REMOTE["Remote Nodes\nTailscale + SSH"]
    REMOTE --> GPU1["GPU / AI Workstation"]
    REMOTE --> GPU2["Compute Workstation"]
    REMOTE --> NAS["NAS / Storage"]
    REMOTE --> ROBOT["Robotics / Edge Device"]

    MEDIA --> NAS
    API -. future .-> CV["Cameras / Vision"]
    API -. future .-> SENSORS["Sensors / Embedded Controllers"]
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the engineering breakdown.

## Current interface

Astra includes five primary operator surfaces:

- **Chat** — console-style interaction and system cards
- **Media** — browses media sources and streams files through the backend
- **Jobs** — creates and tracks development/prototype workloads
- **Nodes** — displays node reachability, service health, and machine metrics
- **Settings** — configures system and interface behavior

> Repository screenshots will be added from a live Astra deployment rather than using fabricated mockups. The application source in `client/src/pages/` contains the current UI implementation.

## Live vs. prototype functionality

| Area | Status | Implementation |
| --- | --- | --- |
| Node reachability | **Live** | Tailscale ping checks against configured hosts |
| Remote system metrics | **Live** | CPU, memory, disk, and Docker information collected over SSH when available |
| Local host metrics | **Live** | Linux shell-based CPU, memory, disk, and Docker checks |
| Service monitoring | **Live** | HTTP health probes for configured services |
| Hermes media integration | **Live** | Local mount, File Browser API, or HTTP directory access with proxy/streaming support |
| Media byte-range streaming | **Live** | HTTP Range handling for large media playback |
| Node dashboard | **Live** | Frontend consumes the status API and exposes health information |
| Job queue | **Prototype** | In-memory development workflow; not yet a production distributed scheduler |
| Chat content | **Prototype** | UI/interaction layer prepared for deeper assistant integration |
| Robotics controls | **Planned extension** | Architecture supports remote devices, sensors, cameras, and robot APIs |

The distinction is intentional: the repository documents working integrations separately from development scaffolding.

## Robotics and edge-device direction

Astra's backend is not limited to desktop compute. The same API and monitoring model can be extended to:

- Raspberry Pi and embedded Linux robots
- ESP32-connected subsystems
- Camera and computer-vision services
- Thermal/depth sensors
- Motor and servo controllers
- Remote diagnostics and health telemetry
- Robot job dispatch and status reporting

This makes Astra a useful companion platform for physical robotics projects where compute, AI, storage, networking, and hardware need to be monitored from one place.

## Technology stack

### Frontend
- React 18
- TypeScript
- Vite
- TanStack React Query
- Tailwind CSS
- Radix UI / shadcn-style components
- Framer Motion
- Wouter

### Backend
- Node.js
- Express 5
- TypeScript
- REST APIs
- Zod validation
- WebSocket support
- Linux process and filesystem integration
- SSH and Tailscale-based diagnostics

### Data and storage
- PostgreSQL
- Drizzle ORM
- drizzle-zod
- NAS / Samba integration
- HTTP media proxying and ranged streaming

## Project structure

```text
client/        React frontend
server/        Express backend, diagnostics, media and API integration
shared/        Shared types, schemas and route contracts
script/        Production build tooling
scripts/       Linux / storage operational utilities
docs/          Architecture and deployment documentation
```

## Development

### Install

```bash
npm install
```

### Configure PostgreSQL

```bash
export DATABASE_URL="postgresql://user:password@host/database"
npm run db:push
```

### Run

```bash
npm run dev
```

### Type-check

```bash
npm run check
```

### Production build

```bash
npm run build
npm start
```

Environment-specific hostnames, credentials, mounts, and service endpoints should be supplied through local configuration/environment variables rather than committed secrets.

## Engineering goals

Astra is an ongoing systems-integration project focused on:

1. **Observability** — quickly determine what is online, degraded, or unreachable.
2. **Modularity** — isolate frontend, API, storage, and infrastructure concerns.
3. **Real system integration** — connect to actual Linux hosts, services, storage, and devices instead of relying solely on mock data.
4. **Fault isolation** — expose enough detail to distinguish network, service, storage, and machine-level failures.
5. **Extensibility** — provide a path from local AI infrastructure into computer vision, automation, and robotics.

## Status

**Active development.** Core node monitoring and Hermes media integration are functional. Job orchestration, assistant behavior, and robotics-specific controls remain development areas.

## Related project

For a more robotics-focused example, see the **Cyberus** repository, which explores Python-based robot control, cameras, servo pose management, ESP32 subsystem status, and computer-vision workflows.
