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

# Always fetch the latest Amazon Linux 2023 AMI — hardcoded AMI IDs go stale
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
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
    from_port   = 3000 # port range start — opens 3000 and 3001
    to_port     = 3001 # port range end
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
  ami           = data.aws_ssm_parameter.al2023.value # always latest Amazon Linux 2023
  instance_type = "t3.small"
  key_name      = var.key_pair_name

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = <<-EOF
    #!/bin/bash
    # Install Docker CE from Docker's official repo (Amazon's docker package
    # bundles an outdated buildx that breaks `docker compose build`)
    dnf install -y git
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    # AL2023's $releasever (e.g. "2023.10.xxx") isn't in Docker's repo — pin to CentOS 9
    sed -i 's/$releasever/9/g' /etc/yum.repos.d/docker-ce.repo
    dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ec2-user
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
