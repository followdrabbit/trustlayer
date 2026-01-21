# Certificados SSL/TLS - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração e gerenciamento de certificados SSL/TLS para o TrustLayer.

## Requisitos de TLS

| Configuração | Valor Recomendado |
|--------------|-------------------|
| Versão Mínima | TLS 1.2 |
| Versão Recomendada | TLS 1.3 |
| Cipher Suites | ECDHE + AES-GCM |
| Key Size (RSA) | 2048+ bits |
| Key Size (ECDSA) | 256+ bits |
| HSTS | max-age=31536000 |

## Let's Encrypt (Gratuito)

### Certbot Standalone

```bash
# Instalar certbot
sudo apt install certbot

# Gerar certificado
sudo certbot certonly --standalone \
  -d trustlayer.exemplo.com \
  -d api.trustlayer.exemplo.com \
  --email admin@exemplo.com \
  --agree-tos

# Certificados gerados em:
# /etc/letsencrypt/live/trustlayer.exemplo.com/fullchain.pem
# /etc/letsencrypt/live/trustlayer.exemplo.com/privkey.pem
```

### Certbot com NGINX

```bash
# Instalar plugin nginx
sudo apt install python3-certbot-nginx

# Gerar e configurar automaticamente
sudo certbot --nginx \
  -d trustlayer.exemplo.com \
  -d api.trustlayer.exemplo.com

# Renovação automática
sudo certbot renew --dry-run
```

### Certbot com DNS Challenge (Wildcard)

```bash
# Para certificado wildcard
sudo certbot certonly --manual \
  --preferred-challenges dns \
  -d "*.trustlayer.exemplo.com" \
  -d "trustlayer.exemplo.com"

# Seguir instruções para criar registro TXT
```

### Renovação Automática

```cron
# /etc/cron.d/certbot
0 0,12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
```

## cert-manager (Kubernetes)

### Instalação

```bash
# Instalar cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Verificar instalação
kubectl get pods -n cert-manager
```

### ClusterIssuer (Let's Encrypt)

```yaml
# cluster-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@exemplo.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@exemplo.com
    privateKeySecretRef:
      name: letsencrypt-staging-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

### Certificate Resource

```yaml
# certificate.yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: trustlayer-tls
  namespace: trustlayer
spec:
  secretName: trustlayer-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: trustlayer.exemplo.com
  dnsNames:
    - trustlayer.exemplo.com
    - api.trustlayer.exemplo.com
    - "*.trustlayer.exemplo.com"
```

### Ingress com TLS

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: trustlayer-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - trustlayer.exemplo.com
        - api.trustlayer.exemplo.com
      secretName: trustlayer-tls
  rules:
    - host: trustlayer.exemplo.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: trustlayer-frontend
                port:
                  number: 80
```

## AWS Certificate Manager (ACM)

### Terraform

```hcl
# acm.tf
resource "aws_acm_certificate" "trustlayer" {
  domain_name               = "trustlayer.exemplo.com"
  subject_alternative_names = [
    "*.trustlayer.exemplo.com",
    "api.trustlayer.exemplo.com"
  ]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Environment = "production"
    Application = "trustlayer"
  }
}

# DNS validation records
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.trustlayer.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Validate certificate
resource "aws_acm_certificate_validation" "trustlayer" {
  certificate_arn         = aws_acm_certificate.trustlayer.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Usar no ALB
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.trustlayer.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.trustlayer.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}
```

## Cloudflare SSL

### Modos de SSL

| Modo | Descrição | Uso |
|------|-----------|-----|
| Off | Sem SSL | ❌ Nunca usar |
| Flexible | SSL no edge apenas | ❌ Não recomendado |
| Full | SSL end-to-end | ✅ Aceitável |
| Full (Strict) | SSL com validação | ✅ Recomendado |

### Origin Certificates

```bash
# Gerar via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/ssl/certificate_packs/order" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "hosts": ["trustlayer.exemplo.com", "*.trustlayer.exemplo.com"],
    "requested_validity": 5475,
    "certificate_authority": "lets_encrypt"
  }'
```

### Configuração via Terraform

```hcl
# cloudflare.tf
resource "cloudflare_zone_settings_override" "trustlayer" {
  zone_id = var.cloudflare_zone_id

  settings {
    ssl                      = "strict"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
    automatic_https_rewrites = "on"
    always_use_https         = "on"
    security_header {
      enabled            = true
      max_age            = 31536000
      include_subdomains = true
      preload            = true
    }
  }
}
```

## Configuração NGINX

### SSL Otimizado

```nginx
# /etc/nginx/conf.d/ssl.conf

# Protocolos e ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# Sessões SSL
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# DH Parameters
ssl_dhparam /etc/nginx/dhparam.pem;

# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Gerar DH Parameters

```bash
# Gerar (pode demorar alguns minutos)
openssl dhparam -out /etc/nginx/dhparam.pem 4096
```

### Virtual Host com SSL

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name trustlayer.exemplo.com;

    ssl_certificate /etc/letsencrypt/live/trustlayer.exemplo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trustlayer.exemplo.com/privkey.pem;

    # Incluir configurações SSL globais
    include /etc/nginx/conf.d/ssl.conf;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name trustlayer.exemplo.com;
    return 301 https://$host$request_uri;
}
```

## Monitoramento de Certificados

### Script de Verificação

```bash
#!/bin/bash
# check-ssl.sh

DOMAINS=("trustlayer.exemplo.com" "api.trustlayer.exemplo.com")
ALERT_DAYS=30

for domain in "${DOMAINS[@]}"; do
  expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
           openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

  expiry_epoch=$(date -d "$expiry" +%s)
  now_epoch=$(date +%s)
  days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

  if [ $days_left -lt $ALERT_DAYS ]; then
    echo "ALERT: $domain certificate expires in $days_left days"
    # Enviar alerta
  else
    echo "OK: $domain certificate valid for $days_left days"
  fi
done
```

### Prometheus Blackbox Exporter

```yaml
# blackbox.yml
modules:
  https_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []
      method: GET
      preferred_ip_protocol: ip4
      tls_config:
        insecure_skip_verify: false
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'ssl-certs'
    metrics_path: /probe
    params:
      module: [https_2xx]
    static_configs:
      - targets:
          - https://trustlayer.exemplo.com
          - https://api.trustlayer.exemplo.com
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### Alertas

```yaml
# alerts.yaml
groups:
  - name: ssl_alerts
    rules:
      - alert: SSLCertExpiringSoon
        expr: probe_ssl_earliest_cert_expiry - time() < 86400 * 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SSL certificate expiring soon"
          description: "Certificate for {{ $labels.instance }} expires in less than 30 days"

      - alert: SSLCertExpired
        expr: probe_ssl_earliest_cert_expiry - time() < 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "SSL certificate expired"
          description: "Certificate for {{ $labels.instance }} has expired"
```

## Troubleshooting

### Verificar Certificado

```bash
# Verificar certificado do servidor
openssl s_client -connect trustlayer.exemplo.com:443 -servername trustlayer.exemplo.com

# Verificar chain completa
openssl s_client -connect trustlayer.exemplo.com:443 -showcerts

# Verificar data de expiração
echo | openssl s_client -servername trustlayer.exemplo.com -connect trustlayer.exemplo.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Verificar cipher suites
nmap --script ssl-enum-ciphers -p 443 trustlayer.exemplo.com
```

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| ERR_CERT_DATE_INVALID | Certificado expirado | Renovar certificado |
| ERR_CERT_COMMON_NAME_INVALID | Nome não corresponde | Verificar SAN/CN |
| ERR_SSL_PROTOCOL_ERROR | Protocolo incompatível | Verificar TLS version |
| ERR_CERT_AUTHORITY_INVALID | CA não confiável | Verificar chain |

### Testar Configuração

```bash
# SSL Labs
curl -s "https://api.ssllabs.com/api/v3/analyze?host=trustlayer.exemplo.com" | jq '.endpoints[0].grade'

# testssl.sh
docker run --rm -ti drwetter/testssl.sh trustlayer.exemplo.com
```

## Próximos Passos

1. [Configurar WAF](./waf-configuration.md)
2. [Configurar Load Balancer](./load-balancer.md)
3. [Monitoramento](./logging-monitoring.md)

## Referências

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
