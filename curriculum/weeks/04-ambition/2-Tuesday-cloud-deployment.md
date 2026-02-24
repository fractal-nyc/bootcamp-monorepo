# Cloud Computing Primitives & Containerized Deployment

## Learning Objectives

By the end of this assignment, engineers will be able to:

1. Name the generic architectural components of a production web system and explain what each one does
2. Map those generic components to brand-specific services on AWS and GCP
3. Containerize an existing React + Vite + Express app with Docker
4. Deploy that container to a cloud VM (EC2 / GCE)
5. Run Grafana and OpenTelemetry alongside their app to observe its performance characteristics
6. Use Terraform to define and provision cloud infrastructure as code

---

## Prerequisites

Engineers should have the following set up **before** the lesson. Use Claude Code to help with any of the CLI setup — it can run the install commands and troubleshoot issues for you.

### Accounts

- [ ] **AWS account** — [Create one here](https://aws.amazon.com/free/).
- [ ] **GCP account** — [Create one here](https://cloud.google.com/free).

Note: once we're done with this exercise, feel free to clean up any cloud resources you no longer want running so you don't cut into your free quota and/or get charged. You can use `terraform destroy` for this.

### CLI tools

Install these locally. Claude Code can run all of these commands for you:

```bash
# Docker
# Mac: Install Docker Desktop from https://www.docker.com/products/docker-desktop/
# Linux: sudo apt-get install -y docker.io docker-compose-v2

# AWS CLI
# Mac: brew install awscli
# Linux: sudo apt-get install -y awscli

# Google Cloud CLI
# Mac: brew install --cask google-cloud-sdk
# Linux: https://cloud.google.com/sdk/docs/install

# Terraform
# Mac: brew install terraform
# Linux: https://developer.hashicorp.com/terraform/install
```

### Authentication

```bash
# Configure AWS credentials (you'll need an access key from the IAM console)
aws configure

# Log into GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Verify both work
aws sts get-caller-identity
gcloud config list
```

### SSH key pairs

You need SSH key pairs to access your cloud VMs — both for manual SSH and for GitHub Actions deployments.

**AWS (EC2):**

Create a key pair in the AWS console (EC2 > Key Pairs) or via CLI:

```bash
aws ec2 create-key-pair --key-name my-app-key --query 'KeyMaterial' --output text > my-app-key.pem
chmod 400 my-app-key.pem
```

This is the key name you'll pass to the Terraform `key_pair_name` variable.

**GCP (Compute Engine):**

Generate a local SSH key pair and add the public key to your GCE instance metadata:

```bash
# Generate a key pair (if you don't already have one)
ssh-keygen -t ed25519 -f ~/.ssh/gce-key -C "your-email@example.com"

# Add the public key to your GCP project metadata (applies to all instances)
gcloud compute project-info add-metadata \
  --metadata-from-file ssh-keys=<(echo "your-username:$(cat ~/.ssh/gce-key.pub)")
```

> **Note**: When working locally, `gcloud compute ssh` manages keys automatically. But for GitHub Actions, you need a key pair stored as a secret, so we create one explicitly here.

### Existing project

- [ ] A working React + Vite + Express app you want to deploy (any project from the accelerator will work)

---

## Part 1 — Architecture Recap

Walk through the final frame of the scaling simulation ([Stage 12: Multiple Data Centers](https://attendabot.com/simulations/scaling/data-centers)). The diagram shows most of the major primitives you'd encounter in a production system:

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

## Part 2 — Cloud Service Mapping Table

The same architecture, mapped to real services you can spin up today:

| Generic Component              | What It Does                                                                                   | AWS                                | GCP                                          | Azure                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| **Virtual Private Network**    | Isolated virtual network that contains your cloud resources (subnets, firewall rules, routing) | VPC (Virtual Private Cloud)        | VPC                                          | VNet (Virtual Network)                          |
| **DNS**                        | Maps domain names to IP addresses                                                              | Route 53                           | Cloud DNS                                    | Azure DNS                                       |
| **CDN**                        | Serves static assets from edge locations near users                                            | CloudFront                         | Cloud CDN                                    | Azure CDN / Front Door                          |
| **Load Balancer**              | Distributes traffic across multiple servers                                                    | Elastic Load Balancing (ALB / NLB) | Cloud Load Balancing                         | Azure Load Balancer / Application Gateway       |
| **Web Servers (Compute)**      | Runs your application code                                                                     | EC2                                | Compute Engine (GCE)                         | Virtual Machines (VMs)                          |
| **Relational Database**        | Structured data with SQL queries                                                               | RDS / Aurora                       | Cloud SQL / AlloyDB                          | Azure SQL / Azure Database for PostgreSQL       |
| **NoSQL Database**             | Flexible schema for sessions, documents, key-value data                                        | DynamoDB                           | Firestore / Bigtable                         | Cosmos DB                                       |
| **Cache**                      | In-memory data store for fast reads                                                            | ElastiCache (Redis or Memcached)   | Memorystore                                  | Azure Cache for Redis                           |
| **Message Queue**              | Decouples producers from consumers for async work                                              | SQS / SNS / Amazon MQ              | Pub/Sub / Cloud Tasks                        | Service Bus / Queue Storage                     |
| **Workers**                    | Background processes that consume from the queue                                               | EC2 / ECS / Lambda                 | Compute Engine / Cloud Run / Cloud Functions | VMs / Container Apps / Azure Functions          |
| **Object Storage**             | Stores files, images, backups                                                                  | S3                                 | Cloud Storage                                | Blob Storage                                    |
| **Container Registry**         | Hosts your Docker images                                                                       | ECR (Elastic Container Registry)   | Artifact Registry                            | Azure Container Registry (ACR)                  |
| **Container Orchestration**    | Manages clusters of containers                                                                 | ECS / EKS                          | GKE (Google Kubernetes Engine) / Cloud Run   | AKS (Azure Kubernetes Service) / Container Apps |
| **Auto Scaling**               | Adjusts number of instances based on load                                                      | Auto Scaling Groups                | Managed Instance Groups                      | Virtual Machine Scale Sets                      |
| **Monitoring / Observability** | Metrics, logs, traces                                                                          | CloudWatch / X-Ray                 | Cloud Monitoring / Cloud Trace               | Azure Monitor / Application Insights            |
| **Secrets Management**         | Securely stores API keys, database passwords, and other sensitive config                       | Secrets Manager                    | Secret Manager                               | Key Vault                                       |
| **CI/CD**                      | Automatically build, test, and deploy code when changes are pushed                             | CodeDeploy / CodePipeline          | Cloud Build / Cloud Deploy                   | Azure DevOps / Azure Pipelines                  |
| **Infrastructure as Code**     | Define infrastructure in config files, version-controlled and repeatable                       | CloudFormation                     | Infrastructure Manager / Deployment Manager  | ARM Templates / Bicep                           |

All of these also work with **Terraform**, which is provider-agnostic — one tool, one language (HCL), any cloud. See Part 5.

### Key takeaway

The _concepts_ are universal. Once you understand what a load balancer does, you can use any provider's version of it. The brand names change, the mental model doesn't.

---

## Part 3 — Docker & Containerization

### Why containers?

Without Docker, deploying means: "it works on my machine" and then spending hours installing the right Node version, the right system libraries, the right env vars on the server. Containers package your app _and its entire environment_ into a single image that runs identically everywhere.

### Core concepts

| Concept            | What it is                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Image**          | A read-only template containing your app, its dependencies, and the OS layer. Think of it as a snapshot.                                                                                                            |
| **Container**      | A running instance of an image. You can run many containers from the same image.                                                                                                                                    |
| **Dockerfile**     | The recipe that builds an image. Each instruction creates a layer.                                                                                                                                                  |
| **Layer**          | Each Dockerfile instruction creates a cached, read-only layer. Unchanged layers are reused on rebuild, which is why you `COPY package.json` before `COPY .` — dependencies are cached until `package.json` changes. |
| **Docker Compose** | A tool for defining multi-container applications in a single YAML file.                                                                                                                                             |
| **Volume**         | Persistent storage that survives container restarts.                                                                                                                                                                |
| **Port mapping**   | Maps a port inside the container to a port on the host (`-p 3000:3000`).                                                                                                                                            |

### Dockerizing a React + Vite + Express app

Here's a minimal `Dockerfile` for a typical app:

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

## Part 4 — Observability with OpenTelemetry & Grafana

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

### Why OTel instead of CloudWatch / Cloud Monitoring?

Every cloud provider has its own observability tools (AWS CloudWatch/X-Ray, GCP Cloud Monitoring/Cloud Trace). Those are fully managed — no infrastructure to run — and they integrate deeply with the provider's own services. The downside is vendor lock-in: your dashboards, queries, and instrumentation code are tied to that provider.

OpenTelemetry is an open standard. You instrument your app once, and you can send telemetry to _any_ backend — self-hosted Grafana, Datadog, or even CloudWatch itself. If you migrate clouds, your instrumentation code doesn't change.

For this lesson, we use OTel + Grafana in Docker so you can see the full stack locally without needing cloud accounts just for observability, and the skills transfer to any provider.

> **Storage note**: The Grafana container stores telemetry data on the EC2/GCE/VM instance's root disk — no extra volume needed. This data won't survive instance termination, but that's fine for this exercise. In production, you'd typically export to a managed backend (CloudWatch, Datadog, Grafana Cloud) instead of storing telemetry locally.

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

// Note: "otel-lgtm" is the service name from docker-compose.yml — Docker's internal
// DNS resolves it to the container's IP on the private network. This URL is
// only reachable from other containers in the same Compose stack, not the public internet.
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

Docker Compose lets you run multiple containers as a single stack. Here we define two services: `app` (built from your Dockerfile) and `otel-lgtm` (pulled from Docker Hub as a pre-built image). They share a private network that Docker Compose creates automatically — that's how your app can reach `http://otel-lgtm:4318` to send telemetry. Each service is still its own isolated container; Compose just wires them together.

```yaml
services: # define the containers in this stack
  app: # your application service
    build: . # build the image from the Dockerfile in the current directory
    ports:
      - "3000:3000" # map host port 3000 to container port 3000
    depends_on:
      - otel-lgtm # wait for the otel-lgtm container to start first

  otel-lgtm: # the observability stack (Grafana + Prometheus + Tempo + Loki + OTel Collector)
    image: grafana/otel-lgtm # pull this pre-built image from Docker Hub
    ports:
      - "3001:3000" # Grafana UI (remapped to 3001 so it doesn't collide with your app)
      - "4317:4317" # OTLP gRPC receiver (for SDKs that send over gRPC)
      - "4318:4318" # OTLP HTTP receiver (where your app sends telemetry)
```

Once running:

- Your app is at `http://localhost:3000`
- Grafana dashboards are at `http://localhost:3001` (default login: `admin` / `admin`)
- Navigate to **Explore** in Grafana, select **Tempo** for traces or **Prometheus** for metrics

---

## Part 5 — Infrastructure as Code with Terraform

### The problem with clicking around in consoles

In Parts 1–4, we learned _what_ cloud services exist and _how_ to containerize an app. But how do you actually create the infrastructure? You could click through the AWS or GCP web console — but that's manual, error-prone, and impossible to reproduce. If you need to set up the same thing for a second project, you're starting from scratch.

**Infrastructure as Code (IaC)** means defining your infrastructure in config files that you can version control, review in PRs, and re-run to get an identical environment every time.

### Why Terraform?

Terraform is the most widely used IaC tool. It works with every major cloud provider using the same language (HCL — HashiCorp Configuration Language). Write once, apply to AWS, GCP, or Azure by swapping the provider.

### Core concepts

| Concept       | What it is                                                                 |
| ------------- | -------------------------------------------------------------------------- |
| **Provider**  | A plugin that talks to a specific cloud (e.g. `aws`, `google`, `azurerm`). |
| **Resource**  | A single piece of infrastructure (a VM, a firewall rule, a DNS record).    |
| **State**     | Terraform's record of what it has created. Stored in `terraform.tfstate`.  |
| **Plan**      | A preview of what Terraform _would_ do. Run `terraform plan` to see it.    |
| **Apply**     | Actually create/update/destroy the infrastructure. Run `terraform apply`.  |
| **Variables** | Parameterize your config so the same file works across environments.       |

### Example: Provision an EC2 instance (AWS)

```hcl
# main.tf — AWS version

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_security_group" "app" {
  name        = "app-sg"
  description = "Allow HTTP traffic to app and Grafana"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app" {
  ami           = "ami-0c02fb55956c7d316" # Amazon Linux 2023 (us-east-1)
  instance_type = "t3.small"
  key_name      = var.key_pair_name

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = <<-EOF
    #!/bin/bash
    yum install -y docker
    systemctl start docker
    usermod -aG docker ec2-user
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  EOF

  tags = {
    Name = "app-server"
  }
}

variable "key_pair_name" {
  description = "Name of your EC2 key pair for SSH access"
  type        = string
}

output "public_ip" {
  value = aws_instance.app.public_ip
}
```

### Example: Provision a Compute Engine VM (GCP)

```hcl
# main.tf — GCP version

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "us-central1"
  zone    = "us-central1-a"
}

resource "google_compute_firewall" "app" {
  name    = "allow-app-ports"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22", "3000", "3001"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["app-server"]
}

resource "google_compute_instance" "app" {
  name         = "app-server"
  machine_type = "e2-small"
  tags         = ["app-server"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
    }
  }

  network_interface {
    network = "default"
    access_config {} # gives it a public IP
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose-v2
    systemctl start docker
    usermod -aG docker $USER
  EOF
}

variable "project_id" {
  description = "Your GCP project ID"
  type        = string
}

output "public_ip" {
  value = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}
```

### The workflow

```bash
# 1. Initialize — downloads the provider plugins
terraform init

# 2. Preview — see what will be created (no changes yet)
terraform plan

# 3. Apply — actually create the infrastructure
terraform apply

# 4. When you're done — tear everything down
terraform destroy
```

> **Key insight**: Notice how the AWS and GCP configs do the _same thing_ (create a VM, open ports, install Docker) but use different resource names. This is the cloud mapping table from Part 2 in action — same concepts, different syntax.

---

## Part 6 — CI/CD with GitHub Actions

### The problem with manual deploys

In Part 5, you provisioned infrastructure with Terraform. But every time you push new code, you'd have to SSH into the VM, pull the latest changes, and restart the containers manually. That's tedious and error-prone — especially if you're deploying to multiple servers.

**CI/CD** (Continuous Integration / Continuous Deployment) automates this. When you push to `main`, a pipeline builds your app, runs tests, and deploys it to your servers — no manual SSH required.

### Why GitHub Actions instead of CodeDeploy / Cloud Build?

Every cloud provider has its own CI/CD service (see the mapping table in Part 2). But **GitHub Actions** lives where your code already is, works with any cloud provider, and is free for public repos. Same idea as choosing Terraform over CloudFormation — one tool, any cloud.

### Core concepts

| Concept      | What it is                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| **Workflow** | A YAML file in `.github/workflows/` that defines your automation pipeline.                             |
| **Trigger**  | The event that starts a workflow (e.g., `push` to `main`, `pull_request`, manual `workflow_dispatch`). |
| **Job**      | A set of steps that run on the same runner (virtual machine). Jobs can run in parallel.                |
| **Step**     | A single command or action within a job.                                                               |
| **Secret**   | An encrypted variable stored in your GitHub repo settings (e.g., SSH keys, cloud credentials).         |

### Example: Deploy to EC2/GCE on push to main

```yaml
# .github/workflows/deploy.yml
name: Deploy to EC2 and GCE

on:
  push:
    branches: [main] # trigger on every push to main

jobs:
  test: # run tests first — deploys are skipped if this fails
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

  deploy-aws: # deploy to EC2 (only if tests pass)
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1 # a community action that SSHs into a server
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ec2-user/app
            git pull origin main
            docker compose down
            docker compose up -d --build

  deploy-gcp: # deploy to GCE (runs in parallel with deploy-aws, only if tests pass)
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to GCE
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.GCE_HOST }}
          username: your-username
          key: ${{ secrets.GCE_SSH_KEY }}
          script: |
            cd /home/your-username/app
            git pull origin main
            docker compose down
            docker compose up -d --build
```

The `test` job runs first. If it passes, both deploy jobs run in parallel. If any test fails, the deploys are skipped entirely — this is the "CI" (Continuous Integration) part of CI/CD.

### Setting up GitHub secrets

Your workflow needs credentials to access your servers. **Never** put these in your code — store them as GitHub secrets:

1. Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `EC2_HOST` — your EC2 instance's public IP address
   - `EC2_SSH_KEY` — the contents of your `.pem` private key file
   - `GCE_HOST` — your GCE instance's public IP address
   - `GCE_SSH_KEY` — a private key whose public key you've added to the GCE instance metadata (unlike local `gcloud compute ssh`, GitHub Actions runners don't have your `gcloud` identity, so you need to manage keys manually)

> **Note on cloud-native alternatives**: SSH is the simplest approach that works identically on both providers. But each cloud has its own way to avoid managing SSH keys: AWS has **SSM (Systems Manager)**, which authenticates through IAM instead of SSH keys. GCP has **`gcloud compute ssh`** with service account auth via `google-github-actions/auth`. These are more secure for production but require additional cloud-specific setup in your workflow.

> **Note on production deploys**: The example above uses `git pull` on the VM for simplicity. In production, you'd typically push a Docker image to a container registry (ECR/Artifact Registry) and pull it on the server, which is more reliable and doesn't require git on the VM.

---

## Part 7 — The Project: Deploy to the Cloud (Hands-on)

### Goal

Deploy one of your existing React + Vite + Express apps to **both** an AWS EC2 instance and a GCP Compute Engine instance, running in Docker with full observability. Get as much help from Claude as you like (writing code, running CLI commands, etc.).

### Steps

#### 1. Containerize your app locally

- Write a `Dockerfile` for your app
- Write a `docker-compose.yml` that includes your app + the `grafana/otel-lgtm` image
- Add OpenTelemetry instrumentation to your Express server
- Verify it works locally: hit your app, then check Grafana for traces and metrics

#### 2. Provision infrastructure with Terraform

- Create a `terraform/` directory in your project with two subdirectories: `aws/` and `gcp/`
- Use the example configs from Part 5 as a starting point
- Run `terraform init` and `terraform apply` for each provider
- Note the public IPs from the output

#### 3. Deploy to your VMs

Once Terraform has created the instances (with Docker pre-installed via the startup scripts):

**AWS EC2:**

1. SSH into the instance: `ssh -i your-key.pem ec2-user@<ec2-public-ip>`
2. Copy your project files (use `scp` or clone from git)
3. Run `docker compose up -d`
4. Visit `http://<ec2-public-ip>:3000` for your app and `:3001` for Grafana

**GCP Compute Engine:**

1. SSH into the instance: `gcloud compute ssh app-server`
2. Copy your project files and run `docker compose up -d`
3. Visit `http://<gce-public-ip>:3000` for your app and `:3001` for Grafana

#### 4. Generate load and observe

Use a simple load testing tool to generate traffic and watch the dashboards:

```bash
# Install hey (HTTP load generator)
# Mac: brew install hey
# Linux: curl -sLo hey https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64 && chmod +x hey
# Windows: curl -sLo hey.exe https://hey-release.s3.us-east-2.amazonaws.com/hey_windows_amd64

# Send 1000 requests, 10 concurrent
hey -n 1000 -c 10 http://<your-server-ip>:3000
```

Then open Grafana and explore:

- **Traces**: See how long each request takes, which middleware runs, which DB queries fire
- **Metrics**: Watch request rate, latency percentiles, error rates
- **Logs**: Search for specific error messages or request IDs

#### 5. Set up CI/CD and verify

- Add a `.github/workflows/deploy.yml` to your repo using the example from Part 6
- Add your SSH keys and host IPs as GitHub secrets
- Make a visible change to your app (e.g., update the page title or add a new element)
- Commit and push to `main`
- Go to your repo's **Actions** tab on GitHub and confirm the workflow ran successfully
- Visit your app on both EC2 and GCE and verify the change is live

### Deliverables

- [ ] `Dockerfile` and `docker-compose.yml` in your project repo
- [ ] `tracing.ts` file with OpenTelemetry setup
- [ ] `terraform/aws/main.tf` and `terraform/gcp/main.tf` that provision your infrastructure
- [ ] `.github/workflows/deploy.yml` that deploys on push to main
- [ ] Screenshot of your app running on EC2 with the public URL
- [ ] Screenshot of your app running on GCE with the public URL
- [ ] Screenshot of a Grafana dashboard showing traces or metrics from load testing
- [ ] Short writeup (3-5 sentences): What did you observe? How did the performance compare between AWS and GCP? What was the most surprising thing you saw in the traces?
- [ ] Run `terraform destroy` for both providers when you're done to avoid charges

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
- [Terraform Getting Started](https://developer.hashicorp.com/terraform/tutorials/aws-get-started)
- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Google Provider Docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Getting Started](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
- [GCP Compute Engine Quickstart](https://cloud.google.com/compute/docs/quickstart-linux)
- [Docker + OpenTelemetry Guide](https://docs.docker.com/guides/opentelemetry/)
- [Grafana OpenTelemetry Documentation](https://grafana.com/docs/opentelemetry/)
