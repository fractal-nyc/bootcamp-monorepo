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
    # Install Docker CE from Docker's official repo (Ubuntu's docker.io package
    # bundles an outdated buildx that breaks `docker compose build`)
    apt-get update
    apt-get install -y ca-certificates curl git
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    # Add all non-root users to docker group so they can run docker without sudo.
    # The startup script runs as root, so $USER would be "root" — we need to
    # target the user who will SSH in (created by gcloud compute ssh).
    getent passwd | awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' | \
      xargs -I{} usermod -aG docker {}
  EOF
}

variable "project_id" {
  description = "Your GCP project ID"
  type        = string
}

output "public_ip" {
  value = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}
