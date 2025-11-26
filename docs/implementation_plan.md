# Implementation Plan: Video to MP3 Converter

This document outlines the step-by-step plan to build the microservices architecture.

## Phase 1: Project Setup & Infrastructure

- [x] **Monorepo Initialization**: Ensure `pnpm` workspace is correctly configured.
- [x] **Docker Compose**: Create a `compose.yaml` that spins up:
  - PostgreSQL
  - MongoDB
  - RabbitMQ
- [x] **Base Service Setup**: Initialize NestJS applications for:
  - `gateway-service`
  - `auth-service`
  - `converter-service`
  - `notification-service`

## Phase 2: Authentication Service (Auth + Postgres)

- [ ] **Database Connection**: Connect `auth-service` to PostgreSQL.
- [ ] **User Entity**: Define User schema (email, password hash).
- [ ] **Auth Logic**: Implement JWT strategy, Login, and Register endpoints.
- [ ] **GRPC/HTTP Interface**: Expose a method for the Gateway to validate tokens.

## Phase 3: API Gateway & Routing

- [ ] **Proxy Logic**: Configure Gateway to route requests to downstream services.
- [ ] **Auth Guard**: Implement a global guard in Gateway that calls `auth-service` to validate requests.

## Phase 4: Converter Service (Upload & Storage)

- [ ] **Database Connection**: Connect `converter-service` to MongoDB.
- [ ] **GridFS Setup**: Configure MongoDB GridFS for storing binary files.
- [ ] **Upload Endpoint**: Create an endpoint to accept `multipart/form-data` (video).
- [ ] **Storage Logic**: Stream uploaded file to GridFS.

## Phase 5: Asynchronous Conversion (Queue & Worker)

- [ ] **RabbitMQ Setup**: Configure RabbitMQ connection in `converter-service`.
- [ ] **Producer**: When a file is uploaded, publish a message to the `video_conversion_queue`.
- [ ] **Consumer**: Create a worker (can be part of `converter-service` or separate) that listens to the queue.
- [ ] **FFmpeg Integration**: Use `fluent-ffmpeg` to convert the video stream from GridFS to MP3.
- [ ] **Save Result**: Store the resulting MP3 back to GridFS.

## Phase 6: Notification Service

- [ ] **Queue Listener**: Connect `notification-service` to RabbitMQ.
- [ ] **Event Handling**: Listen for `conversion_completed` events.
- [ ] **Email Sender**: Implement a mock email sender (console log) or real integration (SendGrid/SMTP) to notify the user.

## Phase 7: End-to-End Integration & Testing

- [ ] **Integration Test**: Upload a video via Gateway -> Verify Auth -> Check Mongo -> Verify Conversion -> Check Notification.
- [ ] **Download Endpoint**: Add an endpoint to download the converted MP3.

## Phase 8: Deployment (Optional/Future)

- [ ] **Kubernetes Manifests**: Create K8s deployments for each service.
- [ ] **CI/CD**: Setup GitHub Actions.
