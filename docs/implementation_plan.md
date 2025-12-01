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

- [x] **Database Connection**: Connect `auth-service` to PostgreSQL.
- [x] **User Entity**: Define User schema (email, password hash).
- [x] **Auth Logic**: Implement JWT strategy, Login, and Register endpoints.
- [x] **HTTP Interface**: Expose a method for the Gateway to validate tokens.

## Phase 3: API Gateway & Routing

- [x] **Proxy Logic**: Configure Gateway to route requests to downstream services.
- [x] **Auth Guard**: Implement a global guard in Gateway that calls `auth-service` to validate requests.

## Phase 4: Converter Service (Upload & Storage)

- [x] **Database Connection**: Connect `converter-service` to MongoDB.
- [x] **GridFS Setup**: Configure MongoDB GridFS for storing binary files.
- [x] **Upload Endpoint**: Create an endpoint to accept `multipart/form-data` (video).
- [x] **Storage Logic**: Stream uploaded file to GridFS.

## Phase 5: Asynchronous Conversion (Queue & Worker)

- [x] **RabbitMQ Setup**: Configure RabbitMQ connection in `converter-service`.
- [x] **Producer**: When a file is uploaded, publish a message to the `video_conversion_queue`.
- [x] **Consumer**: Create a worker (can be part of `converter-service` or separate) that listens to the queue.
- [x] **FFmpeg Integration**: Use `fluent-ffmpeg` to convert the video stream from GridFS to MP3.
- [x] **Save Result**: Store the resulting MP3 back to GridFS.

## Phase 6: Notification Service

- [x] **Queue Listener**: Connect `notification-service` to RabbitMQ.
- [x] **Event Handling**: Listen for `conversion_completed` events.
- [x] **Email Sender**: Implement a mock email sender (console log) or real integration (SendGrid/SMTP) to notify the user.

## Phase 7: End-to-End Integration & Testing

- [ ] **Integration Test**: Upload a video via Gateway -> Verify Auth -> Check Mongo -> Verify Conversion -> Check Notification.
- [ ] **Download Endpoint**: Add an endpoint to download the converted MP3.

## Phase 8: Deployment (Optional/Future)

- [ ] **Kubernetes Manifests**: Create K8s deployments for each service.
- [ ] **CI/CD**: Setup GitHub Actions.
