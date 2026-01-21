# Configuração de Load Balancer - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração de load balancers para distribuir tráfego entre instâncias do TrustLayer, garantindo alta disponibilidade e performance.

## Arquiteturas Suportadas

### 1. Layer 7 (HTTP/HTTPS)

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │  Load Balancer  │
              │    (L7/HTTP)    │
              │   SSL Termination│
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │Frontend │   │Frontend │   │Frontend │
    │    #1   │   │    #2   │   │    #3   │
    └─────────┘   └─────────┘   └─────────┘
```

### 2. Layer 4 (TCP)

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │  Load Balancer  │
              │     (L4/TCP)    │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │  Nginx  │   │  Nginx  │   │  Nginx  │
    │ (SSL)   │   │ (SSL)   │   │ (SSL)   │
    └─────────┘   └─────────┘   └─────────┘
```

## NGINX (Self-Hosted)

### Instalação

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# Habilitar e iniciar
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Configuração como Load Balancer

```nginx
# /etc/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct=$upstream_connect_time '
                    'uht=$upstream_header_time urt=$upstream_response_time';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;

    # Upstream - Frontend
    upstream frontend_servers {
        least_conn;
        server 10.0.1.10:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.1.11:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.1.12:8080 weight=5 max_fails=3 fail_timeout=30s;

        keepalive 32;
    }

    # Upstream - API
    upstream api_servers {
        least_conn;
        server 10.0.2.10:54321 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.2.11:54321 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.2.12:54321 weight=5 max_fails=3 fail_timeout=30s;

        keepalive 32;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Frontend Server
    server {
        listen 443 ssl http2;
        server_name trustlayer.exemplo.com;

        ssl_certificate /etc/nginx/ssl/trustlayer.crt;
        ssl_certificate_key /etc/nginx/ssl/trustlayer.key;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass http://frontend_servers;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            proxy_buffer_size 4k;
            proxy_buffers 8 16k;
            proxy_busy_buffers_size 24k;
        }

        # Health check endpoint
        location /healthz {
            proxy_pass http://frontend_servers/healthz;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            access_log off;
        }
    }

    # API Server
    server {
        listen 443 ssl http2;
        server_name api.trustlayer.exemplo.com;

        ssl_certificate /etc/nginx/ssl/api.trustlayer.crt;
        ssl_certificate_key /etc/nginx/ssl/api.trustlayer.key;

        # Rate limiting
        limit_req zone=api_limit burst=200 nodelay;
        limit_conn conn_limit 100;

        # Security Headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;

        location / {
            proxy_pass http://api_servers;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            # Timeouts maiores para API
            proxy_connect_timeout 10s;
            proxy_send_timeout 120s;
            proxy_read_timeout 120s;

            # Buffer para respostas grandes
            proxy_buffer_size 8k;
            proxy_buffers 16 32k;
            proxy_busy_buffers_size 64k;

            # Para uploads
            client_max_body_size 50m;
        }

        # WebSocket support (para streaming)
        location /realtime/v1 {
            proxy_pass http://api_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 3600s;
        }
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name trustlayer.exemplo.com api.trustlayer.exemplo.com;
        return 301 https://$host$request_uri;
    }
}
```

### Health Check Ativo

```nginx
# Requer nginx-plus ou módulo upstream_check
upstream frontend_servers {
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;

    check interval=3000 rise=2 fall=3 timeout=2000 type=http;
    check_http_send "GET /healthz HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}
```

## HAProxy

### Instalação

```bash
# Ubuntu/Debian
sudo apt install haproxy

# CentOS/RHEL
sudo yum install haproxy

# Habilitar
sudo systemctl enable haproxy
```

### Configuração

```haproxy
# /etc/haproxy/haproxy.cfg

global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

    # SSL
    ssl-default-bind-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
    ssl-default-bind-ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets
    tune.ssl.default-dh-param 2048

defaults
    log global
    mode http
    option httplog
    option dontlognull
    option http-server-close
    option forwardfor except 127.0.0.0/8
    option redispatch
    retries 3
    timeout connect 5s
    timeout client 50s
    timeout server 50s
    timeout http-request 10s
    timeout http-keep-alive 10s
    timeout queue 30s
    timeout tunnel 3600s
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

# Stats Dashboard
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats auth admin:senha-segura

# Frontend HTTPS
frontend https_frontend
    bind *:443 ssl crt /etc/haproxy/certs/trustlayer.pem alpn h2,http/1.1

    # Security headers
    http-response set-header X-Frame-Options SAMEORIGIN
    http-response set-header X-Content-Type-Options nosniff
    http-response set-header X-XSS-Protection "1; mode=block"
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }

    # ACLs para roteamento
    acl is_api hdr(host) -i api.trustlayer.exemplo.com
    acl is_websocket hdr(Upgrade) -i websocket

    # Roteamento
    use_backend api_servers if is_api
    use_backend websocket_servers if is_websocket
    default_backend frontend_servers

# HTTP redirect
frontend http_frontend
    bind *:80
    redirect scheme https code 301

# Backend - Frontend
backend frontend_servers
    balance leastconn
    option httpchk GET /healthz
    http-check expect status 200

    server frontend1 10.0.1.10:8080 check inter 3s fall 3 rise 2
    server frontend2 10.0.1.11:8080 check inter 3s fall 3 rise 2
    server frontend3 10.0.1.12:8080 check inter 3s fall 3 rise 2

# Backend - API
backend api_servers
    balance leastconn
    option httpchk GET /rest/v1/
    http-check expect status 200

    timeout server 120s

    server api1 10.0.2.10:54321 check inter 3s fall 3 rise 2
    server api2 10.0.2.11:54321 check inter 3s fall 3 rise 2
    server api3 10.0.2.12:54321 check inter 3s fall 3 rise 2

# Backend - WebSocket
backend websocket_servers
    balance source
    option httpchk GET /realtime/v1/

    timeout tunnel 3600s

    server ws1 10.0.2.10:54321 check inter 3s fall 3 rise 2
    server ws2 10.0.2.11:54321 check inter 3s fall 3 rise 2
    server ws3 10.0.2.12:54321 check inter 3s fall 3 rise 2
```

## AWS Application Load Balancer

### Terraform Configuration

```hcl
# alb.tf

# Application Load Balancer
resource "aws_lb" "trustlayer" {
  name               = "trustlayer-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "trustlayer-alb"
    enabled = true
  }

  tags = {
    Environment = "production"
    Application = "trustlayer"
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.trustlayer.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.trustlayer.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# HTTP to HTTPS redirect
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.trustlayer.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Listener Rule for API
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    host_header {
      values = ["api.trustlayer.exemplo.com"]
    }
  }
}

# Target Group - Frontend
resource "aws_lb_target_group" "frontend" {
  name     = "trustlayer-frontend"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/healthz"
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = false
  }
}

# Target Group - API
resource "aws_lb_target_group" "api" {
  name     = "trustlayer-api"
  port     = 54321
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    path                = "/rest/v1/"
    matcher             = "200"
  }
}

# Security Group
resource "aws_security_group" "alb" {
  name        = "trustlayer-alb-sg"
  description = "Security group for TrustLayer ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
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

# WAF Association
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.trustlayer.arn
  web_acl_arn  = aws_wafv2_web_acl.trustlayer.arn
}
```

## GCP Cloud Load Balancing

### Terraform Configuration

```hcl
# gcp-lb.tf

# External IP
resource "google_compute_global_address" "trustlayer" {
  name = "trustlayer-ip"
}

# SSL Certificate
resource "google_compute_managed_ssl_certificate" "trustlayer" {
  name = "trustlayer-cert"

  managed {
    domains = [
      "trustlayer.exemplo.com",
      "api.trustlayer.exemplo.com"
    ]
  }
}

# Health Check
resource "google_compute_health_check" "frontend" {
  name               = "trustlayer-frontend-health"
  check_interval_sec = 10
  timeout_sec        = 5

  http_health_check {
    port         = 8080
    request_path = "/healthz"
  }
}

# Backend Service
resource "google_compute_backend_service" "frontend" {
  name                  = "trustlayer-frontend"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.frontend.id]
  load_balancing_scheme = "EXTERNAL"

  backend {
    group           = google_compute_instance_group_manager.frontend.instance_group
    balancing_mode  = "UTILIZATION"
    max_utilization = 0.8
  }

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
  }
}

# URL Map
resource "google_compute_url_map" "trustlayer" {
  name            = "trustlayer-url-map"
  default_service = google_compute_backend_service.frontend.id

  host_rule {
    hosts        = ["api.trustlayer.exemplo.com"]
    path_matcher = "api"
  }

  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.api.id
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "trustlayer" {
  name             = "trustlayer-https-proxy"
  url_map          = google_compute_url_map.trustlayer.id
  ssl_certificates = [google_compute_managed_ssl_certificate.trustlayer.id]
}

# Forwarding Rule
resource "google_compute_global_forwarding_rule" "https" {
  name       = "trustlayer-https"
  target     = google_compute_target_https_proxy.trustlayer.id
  port_range = "443"
  ip_address = google_compute_global_address.trustlayer.address
}
```

## Monitoramento

### Métricas Importantes

| Métrica | Descrição | Threshold |
|---------|-----------|-----------|
| Request Rate | Requisições/segundo | Baseline + 50% |
| Error Rate (5xx) | Taxa de erros do servidor | < 1% |
| Latency P99 | Latência percentil 99 | < 500ms |
| Active Connections | Conexões ativas | < 80% capacity |
| Backend Health | Backends saudáveis | 100% |

### Prometheus Queries

```promql
# Request rate
sum(rate(nginx_http_requests_total[5m])) by (status)

# Error rate
sum(rate(nginx_http_requests_total{status=~"5.."}[5m]))
/ sum(rate(nginx_http_requests_total[5m])) * 100

# Latency P99
histogram_quantile(0.99,
  sum(rate(nginx_http_request_duration_seconds_bucket[5m])) by (le))

# Backend health
count(haproxy_server_status == 1) by (backend)
```

## Troubleshooting

### Verificar conectividade

```bash
# Testar backend diretamente
curl -v http://10.0.1.10:8080/healthz

# Verificar portas
ss -tlnp | grep -E '80|443|8080'

# Testar SSL
openssl s_client -connect trustlayer.exemplo.com:443
```

### Logs

```bash
# NGINX
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# HAProxy
tail -f /var/log/haproxy.log
```

## Próximos Passos

1. [Configurar SSL/TLS](./ssl-certificates.md)
2. [Configurar WAF](./waf-configuration.md)
3. [Monitoramento](./logging-monitoring.md)

## Referências

- [NGINX Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/)
- [HAProxy Documentation](https://www.haproxy.org/documentation/)
- [AWS ALB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [GCP Load Balancing](https://cloud.google.com/load-balancing/docs)
