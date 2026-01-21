# Configuração de WAF - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração do Web Application Firewall (WAF) para proteger o TrustLayer contra ataques web comuns.

## Arquitetura

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │       WAF       │
              │  (Layer 7)      │
              │  - OWASP Rules  │
              │  - Rate Limit   │
              │  - Geo Block    │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Load Balancer  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   TrustLayer    │
              └─────────────────┘
```

## AWS WAF

### Criar Web ACL

```hcl
# terraform/waf.tf

resource "aws_wafv2_web_acl" "trustlayer" {
  name        = "trustlayer-waf"
  description = "WAF for TrustLayer Application"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # OWASP Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # SQL Injection Protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rate Limiting
  rule {
    name     = "RateLimitRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # Geo Blocking (opcional)
  rule {
    name     = "GeoBlockRule"
    priority = 5

    action {
      block {}
    }

    statement {
      geo_match_statement {
        country_codes = ["RU", "CN", "KP", "IR"]  # Ajustar conforme necessário
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockRule"
      sampled_requests_enabled   = true
    }
  }

  # IP Whitelist
  rule {
    name     = "IPWhitelist"
    priority = 0

    action {
      allow {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.whitelist.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "IPWhitelist"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "TrustLayerWAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Environment = "production"
    Application = "trustlayer"
  }
}

# IP Set para whitelist
resource "aws_wafv2_ip_set" "whitelist" {
  name               = "trustlayer-whitelist"
  description        = "Whitelisted IPs"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.whitelisted_ips
}

# Associar ao ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.trustlayer.arn
  web_acl_arn  = aws_wafv2_web_acl.trustlayer.arn
}
```

### Regras Customizadas

```hcl
# Bloquear paths sensíveis
resource "aws_wafv2_rule_group" "custom_rules" {
  name        = "trustlayer-custom-rules"
  scope       = "REGIONAL"
  capacity    = 100

  rule {
    name     = "BlockAdminFromInternet"
    priority = 1

    action {
      block {}
    }

    statement {
      and_statement {
        statement {
          byte_match_statement {
            search_string = "/admin"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
            positional_constraint = "STARTS_WITH"
          }
        }
        statement {
          not_statement {
            statement {
              ip_set_reference_statement {
                arn = aws_wafv2_ip_set.internal_ips.arn
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BlockAdminFromInternet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "TrustLayerCustomRules"
    sampled_requests_enabled   = true
  }
}
```

## Cloudflare WAF

### Managed Rules

```yaml
# Configuração via API
waf_packages:
  - id: "cloudflare_managed_rules"
    sensitivity: "high"
    action_mode: "block"

  - id: "owasp_ruleset"
    sensitivity: "medium"
    action_mode: "block"
```

### Custom Rules

```yaml
# firewall_rules.yaml
rules:
  - name: "Block SQL Injection Attempts"
    expression: |
      (http.request.uri.query contains "UNION SELECT") or
      (http.request.uri.query contains "' OR '1'='1") or
      (http.request.body.raw contains "UNION SELECT")
    action: "block"
    priority: 1

  - name: "Rate Limit Login"
    expression: |
      (http.request.uri.path eq "/auth/v1/token") and
      (http.request.method eq "POST")
    action: "challenge"
    ratelimit:
      requests_per_period: 10
      period: 60
    priority: 2

  - name: "Block Bad Bots"
    expression: |
      (cf.client.bot) and
      not (cf.verified_bot_category in {"Search Engine Crawler" "Monitoring & Analytics"})
    action: "block"
    priority: 3

  - name: "Protect API"
    expression: |
      (http.request.uri.path matches "^/rest/v1/.*") and
      not (http.request.headers["apikey"] exists)
    action: "block"
    priority: 4

  - name: "Geo Block"
    expression: |
      (ip.geoip.country in {"RU" "CN" "KP" "IR"})
    action: "challenge"
    priority: 5
```

### Page Rules

```yaml
page_rules:
  - targets:
      - "trustlayer.exemplo.com/admin/*"
    actions:
      security_level: "high"
      waf: "on"

  - targets:
      - "api.trustlayer.exemplo.com/*"
    actions:
      security_level: "medium"
      waf: "on"
      browser_check: "on"
```

## ModSecurity (Self-Hosted)

### Instalação com NGINX

```bash
# Ubuntu/Debian
sudo apt install libmodsecurity3 libmodsecurity-dev
sudo apt install libnginx-mod-security

# Baixar OWASP Core Rule Set
cd /etc/nginx
git clone https://github.com/coreruleset/coreruleset.git modsecurity-crs
cp modsecurity-crs/crs-setup.conf.example modsecurity-crs/crs-setup.conf
```

### Configuração NGINX

```nginx
# /etc/nginx/nginx.conf
load_module modules/ngx_http_modsecurity_module.so;

http {
    modsecurity on;
    modsecurity_rules_file /etc/nginx/modsecurity/main.conf;
}
```

### main.conf

```conf
# /etc/nginx/modsecurity/main.conf

# Basic configuration
SecRuleEngine On
SecRequestBodyAccess On
SecResponseBodyAccess Off
SecRequestBodyLimit 52428800
SecRequestBodyNoFilesLimit 131072

# Audit logging
SecAuditEngine RelevantOnly
SecAuditLogRelevantStatus "^(?:5|4(?!04))"
SecAuditLogParts ABIJDEFHZ
SecAuditLogType Serial
SecAuditLog /var/log/modsecurity/audit.log

# Debug logging (desabilitar em produção)
SecDebugLog /var/log/modsecurity/debug.log
SecDebugLogLevel 0

# Temporary files
SecTmpDir /tmp
SecDataDir /var/lib/modsecurity

# Include OWASP CRS
Include /etc/nginx/modsecurity-crs/crs-setup.conf
Include /etc/nginx/modsecurity-crs/rules/*.conf

# Custom exclusions for TrustLayer
SecRule REQUEST_URI "@beginsWith /api/v1/ai-assistant" \
    "id:1001,phase:1,pass,nolog,ctl:ruleRemoveById=942100"

# Whitelist internal IPs
SecRule REMOTE_ADDR "@ipMatch 10.0.0.0/8,172.16.0.0/12,192.168.0.0/16" \
    "id:1002,phase:1,pass,nolog,ctl:ruleEngine=Off"
```

### Custom Rules

```conf
# /etc/nginx/modsecurity/custom-rules.conf

# Bloquear tentativas de path traversal
SecRule REQUEST_URI "\.\./" \
    "id:2001,phase:1,deny,status:403,log,msg:'Path Traversal Attempt'"

# Bloquear user-agents maliciosos
SecRule REQUEST_HEADERS:User-Agent "@pmFromFile bad-user-agents.txt" \
    "id:2002,phase:1,deny,status:403,log,msg:'Bad User Agent'"

# Proteger endpoints de autenticação
SecRule REQUEST_URI "@beginsWith /auth/v1/token" \
    "id:2003,phase:1,chain,deny,status:429,log,msg:'Login Rate Limit'"
SecRule &TX:login_counter "@gt 10" ""

# Contador de tentativas de login
SecRule REQUEST_URI "@beginsWith /auth/v1/token" \
    "id:2004,phase:5,pass,nolog,setvar:TX.login_counter=+1,expirevar:TX.login_counter=60"

# Bloquear uploads de arquivos perigosos
SecRule FILES_TMPNAMES "@rx \.(?:exe|dll|bat|cmd|ps1|sh)$" \
    "id:2005,phase:2,deny,status:403,log,msg:'Dangerous File Upload'"
```

## Regras OWASP Top 10

### Cobertura

| OWASP | Descrição | Proteção |
|-------|-----------|----------|
| A01 | Broken Access Control | RLS + WAF |
| A02 | Cryptographic Failures | TLS 1.2+ |
| A03 | Injection | SQLi/XSS rules |
| A04 | Insecure Design | Architecture |
| A05 | Security Misconfiguration | Hardening |
| A06 | Vulnerable Components | Updates |
| A07 | Authentication Failures | MFA + Rate Limit |
| A08 | Data Integrity Failures | Input validation |
| A09 | Security Logging | Audit logs |
| A10 | SSRF | URL validation |

### Regras Específicas

```conf
# A03 - SQL Injection
SecRule ARGS "@detectSQLi" \
    "id:3001,phase:2,deny,status:403,log,msg:'SQL Injection'"

# A03 - XSS
SecRule ARGS "@detectXSS" \
    "id:3002,phase:2,deny,status:403,log,msg:'XSS Attack'"

# A07 - Brute Force
SecRule REQUEST_URI "@beginsWith /auth/" \
    "id:3003,phase:1,pass,nolog,setvar:ip.auth_attempts=+1,expirevar:ip.auth_attempts=300"

SecRule IP:auth_attempts "@gt 20" \
    "id:3004,phase:1,deny,status:429,log,msg:'Brute Force Detected'"

# A10 - SSRF
SecRule ARGS "@rx ^https?://(?:localhost|127\.|10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)" \
    "id:3005,phase:2,deny,status:403,log,msg:'SSRF Attempt'"
```

## Monitoramento

### Métricas

```promql
# Taxa de bloqueios
sum(rate(waf_blocked_requests_total[5m])) by (rule)

# Top IPs bloqueados
topk(10, sum(waf_blocked_requests_total) by (source_ip))

# Distribuição por tipo de ataque
sum(waf_blocked_requests_total) by (attack_type)
```

### Dashboard

```yaml
# Grafana dashboard panels
panels:
  - title: "WAF Blocked Requests"
    type: graph
    query: "sum(rate(waf_blocked_requests_total[5m]))"

  - title: "Top Blocked Rules"
    type: table
    query: "topk(10, sum(waf_blocked_requests_total) by (rule_id))"

  - title: "Attack Types Distribution"
    type: piechart
    query: "sum(waf_blocked_requests_total) by (attack_type)"
```

### Alertas

```yaml
# alerts.yaml
groups:
  - name: waf_alerts
    rules:
      - alert: HighWAFBlockRate
        expr: sum(rate(waf_blocked_requests_total[5m])) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High WAF block rate detected"

      - alert: PotentialDDoS
        expr: sum(rate(waf_blocked_requests_total{rule="RateLimitRule"}[1m])) > 1000
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Potential DDoS attack detected"
```

## Troubleshooting

### Falsos Positivos

```bash
# Identificar regra que bloqueou
grep "denied" /var/log/modsecurity/audit.log | tail -20

# Desabilitar regra específica
SecRuleRemoveById 942100

# Whitelist endpoint específico
SecRule REQUEST_URI "@beginsWith /api/safe-endpoint" \
    "id:9999,phase:1,pass,nolog,ctl:ruleEngine=Off"
```

### Análise de Logs

```bash
# Requests bloqueados por hora
cat /var/log/modsecurity/audit.log | \
  grep -oP '\d{4}/\d{2}/\d{2} \d{2}' | \
  sort | uniq -c

# Top regras acionadas
grep "id:" /var/log/modsecurity/audit.log | \
  grep -oP 'id:\d+' | \
  sort | uniq -c | sort -rn | head -20
```

## Próximos Passos

1. [Configurar SSL/TLS](./ssl-certificates.md)
2. [Monitoramento](./logging-monitoring.md)
3. [Alertas](./alerts.md)

## Referências

- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [Cloudflare WAF](https://developers.cloudflare.com/waf/)
- [OWASP ModSecurity CRS](https://coreruleset.org/)
- [OWASP Top 10](https://owasp.org/Top10/)
