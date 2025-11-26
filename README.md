# Video to MP3 Converter (Microservices)

A scalable, microservices-based application for converting video files to MP3 audio. Built with NestJS, RabbitMQ, PostgreSQL, and MongoDB.

## 🏗 Architecture

The system consists of the following services:

- **API Gateway**: Entry point for all client requests. Handles routing and initial auth validation.
- **Auth Service**: Manages user authentication and identity (PostgreSQL).
- **Converter Service**: Handles video uploads, storage (MongoDB GridFS), and conversion logic.
- **Notification Service**: Sends email/push notifications upon task completion.

Infrastructure:

- **RabbitMQ**: Message broker for asynchronous communication between services.
- **PostgreSQL**: Relational database for user data.
- **MongoDB**: NoSQL database for file storage and metadata.

For more details, check the [Architecture Plan](./docs/architecture_plan.md).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v9+)
- [Docker](https://www.docker.com/) & Docker Compose

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure

Start the databases and message broker using Docker:

```bash
pnpm docker:up
```

This will spin up:

- Postgres (Port 5432)
- MongoDB (Port 27017)
- RabbitMQ (Port 5672, UI: 15672)
- pgAdmin (Port 5050)

### 3. Run Services (Development)

Start all microservices in development mode (watch mode):

```bash
pnpm dev
```

This runs `start:dev` for all apps in parallel.

## 🛠 Available Scripts

| Script                | Description                                 |
| :-------------------- | :------------------------------------------ |
| `pnpm dev`            | Start all microservices in development mode |
| `pnpm build`          | Build all services                          |
| `pnpm test`           | Run tests across all services               |
| `pnpm docker:up`      | Start infrastructure (DBs, RabbitMQ)        |
| `pnpm docker:down`    | Stop infrastructure                         |
| `pnpm docker:logs`    | View infrastructure logs                    |
| `pnpm db:auth:shell`  | Open psql shell for Auth DB                 |
| `pnpm db:mongo:shell` | Open mongosh shell for Mongo DB             |

## 📂 Project Structure

```
.
├── apps/                   # Microservices source code
│   ├── auth-service/
│   ├── converter-service/
│   ├── gateway-service/
│   └── notification-service/
├── docs/                   # Documentation
├── k8s/                    # Kubernetes manifests (future)
├── packages/               # Shared libraries (future)
├── compose.yaml            # Docker Compose configuration
└── package.json            # Root scripts and dependencies
```
