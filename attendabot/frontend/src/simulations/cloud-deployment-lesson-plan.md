# Cloud Computing Primitives & Containerized Deployment

> Lesson plan for the AI Accelerator — based on the final stage of the "Scale From Zero to Millions" simulation.

## Learning Objectives

By the end of this lesson, students will be able to:

1. Name the generic architectural components of a production web system and explain what each one does
2. Map those generic components to brand-specific services on AWS and GCP
3. Containerize an existing React + Vite + Express app with Docker
4. Deploy that container to a cloud VM (EC2 / GCE)
5. Run Grafana and OpenTelemetry alongside their app to observe its performance characteristics

---

## Part 1 — Architecture Recap (15 min)

Walk through the final frame of the scaling simulation (Stage 12: Multiple Data Centers). The diagram shows every major primitive you'd encounter in a production system:

```
Users ──> GeoDNS ──> CDN (static assets)
                 └──> Load Balancer
                        └──> Web Servers
                              ├──> Cache
                              ├──> NoSQL (sessions)
                              ├──> Databases (relational, sharded)
                              └──> Message Queue ──> Workers
```

Each of these components exists as a managed service on every major cloud provider. You don't have to build them yourself — you rent them.

---

## Part 2 — Cloud Service Mapping Table (20 min)

The same architecture, mapped to real services you can spin up today:

| Generic Component | What It Does | AWS | GCP |
|---|---|---|---|
| **DNS** | Maps domain names to IP addresses | Route 53 | Cloud DNS |
| **CDN** | Serves static assets from edge locations near users | CloudFront | Cloud CDN |
| **Load Balancer** | Distributes traffic across multiple servers | Elastic Load Balancing (ALB / NLB) | Cloud Load Balancing |
| **Web Servers (Compute)** | Runs your application code | EC2 | Compute Engine (GCE) |
| **Relational Database** | Structured data with SQL queries | RDS / Aurora | Cloud SQL / AlloyDB |
| **NoSQL Database** | Flexible schema for sessions, documents, key-value data | DynamoDB | Firestore / Bigtable |
| **Cache** | In-memory data store for fast reads | ElastiCache (Redis or Memcached) | Memorystore |
| **Message Queue** | Decouples producers from consumers for async work | SQS / SNS / Amazon MQ | Pub/Sub / Cloud Tasks |
| **Workers** | Background processes that consume from the queue | EC2 / ECS / Lambda | Compute Engine / Cloud Run / Cloud Functions |
| **Object Storage** | Stores files, images, backups | S3 | Cloud Storage |
| **Container Registry** | Hosts your Docker images | ECR (Elastic Container Registry) | Artifact Registry |
| **Container Orchestration** | Manages clusters of containers | ECS / EKS | GKE (Google Kubernetes Engine) / Cloud Run |
| **Auto Scaling** | Adjusts number of instances based on load | Auto Scaling Groups | Managed Instance Groups |
| **Monitoring / Observability** | Metrics, logs, traces | CloudWatch / X-Ray | Cloud Monitoring / Cloud Trace |

### Key takeaway

The *concepts* are universal. Once you understand what a load balancer does, you can use any provider's version of it. The brand names change, the mental model doesn't.

---

## Part 3 — Docker & Containerization (30 min)

### Why containers?

Without Docker, deploying means: "it works on my machine" and then spending hours installing the right Node version, the right system libraries, the right env vars on the server. Containers package your app *and its entire environment* into a single image that runs identically everywhere.

### Core concepts

| Concept | What it is |
|---|---|
| **Image** | A read-only template containing your app, its dependencies, and the OS layer. Think of it as a snapshot. |
| **Container** | A running instance of an image. You can run many containers from the same image. |
| **Dockerfile** | The recipe that builds an image. Each instruction creates a layer. |
| **Docker Compose** | A tool for defining multi-container applications in a single YAML file. |
| **Volume** | Persistent storage that survives container restarts. |
| **Port mapping** | Maps a port inside the container to a port on the host (`-p 3000:3000`). |

### Dockerizing a React + Vite + Express app

Here's a minimal `Dockerfile` for a typical bootcamp app:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm install

# Copy application code
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the port your Express server listens on
EXPOSE 3000

CMD ["node", "server.js"]
```

> **Note**: If the app has a separate frontend and backend, you may need a multi-stage build or two separate containers. For this project, assume a single Express server that serves the built Vite assets.

---

## Part 4 — Observability with OpenTelemetry & Grafana (30 min)

### Why observability matters

You can't improve what you can't measure. In production, you need three pillars:

1. **Metrics** — numeric measurements over time (request rate, error rate, CPU usage)
2. **Traces** — the path a single request takes through your system (which functions were called, how long each took)
3. **Logs** — discrete events for debugging

### The stack

We'll use **Grafana's all-in-one LGTM image** (`grafana/otel-lgtm`), which bundles:

- **OpenTelemetry Collector** — receives telemetry from your app
- **Prometheus** — stores metrics
- **Tempo** — stores traces
- **Loki** — stores logs
- **Grafana** — dashboards for all of the above

This runs as a single container alongside your app. No configuration needed — it works with OpenTelemetry's defaults.

### Instrumenting your Express app

Install the OpenTelemetry packages:

```bash
npm install @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http
```

Create a `tracing.ts` (or `tracing.js`) file that initializes the SDK:

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

const sdk = new NodeSDK({
  serviceName: "my-app",
  traceExporter: new OTLPTraceExporter({
    url: "http://otel-lgtm:4318/v1/traces",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: "http://otel-lgtm:4318/v1/metrics",
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

Then require it before your app starts (in your `CMD` or entrypoint):

```dockerfile
CMD ["node", "--require", "./tracing.js", "server.js"]
```

### Docker Compose for the full stack

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - otel-lgtm

  otel-lgtm:
    image: grafana/otel-lgtm
    ports:
      - "3001:3000"   # Grafana UI
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
```

Once running:
- Your app is at `http://localhost:3000`
- Grafana dashboards are at `http://localhost:3001` (default login: `admin` / `admin`)
- Navigate to **Explore** in Grafana, select **Tempo** for traces or **Prometheus** for metrics

---

## Part 5 — The Project: Deploy to the Cloud (Hands-on)

### Goal

Deploy one of your existing React + Vite + Express apps to **both** an AWS EC2 instance and a GCP Compute Engine instance, running in Docker with full observability.

### Steps

#### 1. Containerize your app locally

- Write a `Dockerfile` for your app
- Write a `docker-compose.yml` that includes your app + the `grafana/otel-lgtm` image
- Add OpenTelemetry instrumentation to your Express server
- Verify it works locally: hit your app, then check Grafana for traces and metrics

#### 2. Deploy to AWS EC2

1. Launch an EC2 instance (Amazon Linux 2023 or Ubuntu, `t3.small` or larger)
2. SSH into the instance
3. Install Docker and Docker Compose:
   ```bash
   # Amazon Linux 2023
   sudo yum install -y docker
   sudo systemctl start docker
   sudo usermod -aG docker ec2-user
   # Install Docker Compose plugin
   sudo mkdir -p /usr/local/lib/docker/cli-plugins
   sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
     -o /usr/local/lib/docker/cli-plugins/docker-compose
   sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
   ```
4. Copy your project files to the instance (use `scp` or clone from git)
5. Run `docker compose up -d`
6. Open the security group to allow inbound traffic on ports 3000 and 3001
7. Visit `http://<ec2-public-ip>:3000` for your app and `:3001` for Grafana

#### 3. Deploy to GCP Compute Engine

1. Create a Compute Engine VM (Ubuntu, `e2-small` or larger)
2. SSH into the instance (use the GCP Console SSH button or `gcloud compute ssh`)
3. Install Docker and Docker Compose:
   ```bash
   # Ubuntu on GCE
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-v2
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   ```
4. Copy your project files and run `docker compose up -d`
5. Create a firewall rule to allow TCP on ports 3000 and 3001:
   ```bash
   gcloud compute firewall-rules create allow-app-ports \
     --allow tcp:3000,tcp:3001 \
     --target-tags=http-server \
     --description="Allow app and Grafana access"
   ```
6. Visit `http://<gce-external-ip>:3000` for your app and `:3001` for Grafana

#### 4. Generate load and observe

Use a simple load testing tool to generate traffic and watch the dashboards:

```bash
# Install hey (HTTP load generator)
# On Mac: brew install hey
# Or download from: https://github.com/rakyll/hey

# Send 1000 requests, 10 concurrent
hey -n 1000 -c 10 http://<your-server-ip>:3000
```

Then open Grafana and explore:
- **Traces**: See how long each request takes, which middleware runs, which DB queries fire
- **Metrics**: Watch request rate, latency percentiles, error rates
- **Logs**: Search for specific error messages or request IDs

### Deliverables

- [ ] `Dockerfile` and `docker-compose.yml` in your project repo
- [ ] `tracing.ts` file with OpenTelemetry setup
- [ ] Screenshot of your app running on EC2 with the public URL
- [ ] Screenshot of your app running on GCE with the public URL
- [ ] Screenshot of a Grafana dashboard showing traces or metrics from load testing
- [ ] Short writeup (3-5 sentences): What did you observe? How did the performance compare between AWS and GCP? What was the most surprising thing you saw in the traces?

---

## Stretch Goals

- **Add a custom metric**: Use the OpenTelemetry API to track something specific to your app (e.g., number of API calls to a particular endpoint, or time spent in a specific function)
- **Set up alerts**: Configure Grafana to send a notification when error rate exceeds a threshold
- **Try a managed container service**: Deploy the same Docker Compose setup to AWS ECS or GCP Cloud Run instead of a raw VM
- **Add a reverse proxy**: Put Nginx or Caddy in front of your app container with HTTPS (use Let's Encrypt)
- **Multi-region**: Deploy to two different AWS regions and use Route 53 to geo-route traffic between them

---

## Resources

- [Docker Getting Started Guide](https://docs.docker.com/get-started/)
- [OpenTelemetry Node.js Instrumentation](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/)
- [Grafana LGTM Docker Image](https://github.com/grafana/docker-otel-lgtm)
- [AWS EC2 Getting Started](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
- [GCP Compute Engine Quickstart](https://cloud.google.com/compute/docs/quickstart-linux)
- [Docker + OpenTelemetry Guide](https://docs.docker.com/guides/opentelemetry/)
- [Grafana OpenTelemetry Documentation](https://grafana.com/docs/opentelemetry/)
