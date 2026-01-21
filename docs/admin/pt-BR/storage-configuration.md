# Storage e Upload de Arquivos - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração do sistema de armazenamento de arquivos do TrustLayer, incluindo uploads de evidências, avatares, logos e relatórios.

## Arquitetura de Storage

```
┌─────────────────────────────────────────────────────────────┐
│                    TrustLayer Application                   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Storage                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   avatars     │  │   evidence    │  │   reports     │   │
│  │   (public)    │  │   (private)   │  │   (private)   │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Local Disk   │    │   AWS S3      │    │   GCS/Azure   │
│  (dev/teste)  │    │  (produção)   │    │  (alternativa)│
└───────────────┘    └───────────────┘    └───────────────┘
```

## Buckets

### Estrutura de Buckets

| Bucket | Visibilidade | Uso | Limite |
|--------|--------------|-----|--------|
| `avatars` | Público | Fotos de perfil | 5MB/arquivo |
| `logos` | Público | Logos de organizações | 2MB/arquivo |
| `evidence` | Privado | Evidências de assessment | 50MB/arquivo |
| `reports` | Privado | Relatórios gerados | 100MB/arquivo |
| `imports` | Privado | Arquivos de importação | 10MB/arquivo |

### Criar Buckets (SQL)

```sql
-- Criar bucket de avatars (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Criar bucket de evidence (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  52428800,  -- 50MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
);

-- Criar bucket de reports (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  104857600,  -- 100MB
  ARRAY['application/pdf', 'text/html', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);
```

### Políticas de Acesso (RLS)

```sql
-- Avatars: qualquer um pode ver, usuário pode fazer upload do próprio
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Evidence: usuário pode ver/modificar seus próprios arquivos
CREATE POLICY "Users can access own evidence"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins podem acessar todas as evidências
CREATE POLICY "Admins can access all evidence"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'evidence'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Reports: apenas o dono e admins
CREATE POLICY "Users can access own reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
    )
  );
```

## Backends de Storage

### 1. Local (Desenvolvimento)

```env
# .env
STORAGE_BACKEND=file
FILE_STORAGE_PATH=/var/lib/supabase/storage
```

### 2. AWS S3 (Produção)

```env
# .env
STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=trustlayer-storage
AWS_S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
```

**Política IAM:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::trustlayer-storage",
        "arn:aws:s3:::trustlayer-storage/*"
      ]
    }
  ]
}
```

**Bucket Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadAvatars",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::trustlayer-storage/avatars/*"
    },
    {
      "Sid": "PublicReadLogos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::trustlayer-storage/logos/*"
    }
  ]
}
```

**CORS Configuration:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://trustlayer.exemplo.com"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Google Cloud Storage

```env
# .env
STORAGE_BACKEND=gcs
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCS_BUCKET=trustlayer-storage
GCS_PROJECT_ID=seu-projeto-gcp
```

### 4. Azure Blob Storage

```env
# .env
STORAGE_BACKEND=azure
AZURE_STORAGE_ACCOUNT=trustlayerstorage
AZURE_STORAGE_KEY=sua-chave-de-acesso
AZURE_STORAGE_CONTAINER=trustlayer
```

## Configuração de Upload

### Limites de Arquivo

```typescript
// src/lib/storage/config.ts
export const STORAGE_CONFIG = {
  maxFileSizes: {
    avatar: 5 * 1024 * 1024,     // 5MB
    logo: 2 * 1024 * 1024,       // 2MB
    evidence: 50 * 1024 * 1024,  // 50MB
    report: 100 * 1024 * 1024,   // 100MB
    import: 10 * 1024 * 1024,    // 10MB
  },
  allowedMimeTypes: {
    avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    logo: ['image/jpeg', 'image/png', 'image/svg+xml'],
    evidence: [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ],
    report: ['application/pdf', 'text/html', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    import: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'],
  },
};
```

### Variáveis de Ambiente

```env
# Limites de upload (frontend)
VITE_IMPORT_MAX_FILE_BYTES=10485760      # 10MB
VITE_IMPORT_MAX_CELL_CHARS=2000
VITE_IMPORT_MAX_ROWS=5000

# Antivírus (opcional)
VITE_IMPORT_MALWARE_SCAN_URL=https://scanner.local/scan
VITE_IMPORT_MALWARE_SCAN_REQUIRED=true
```

## Antivírus para Uploads

### ClamAV Integration

```yaml
# docker-compose.yml
services:
  clamav:
    image: clamav/clamav:latest
    container_name: trustlayer-clamav
    restart: unless-stopped
    ports:
      - "3310:3310"
    volumes:
      - clamav-db:/var/lib/clamav

  clamav-rest:
    image: benzino77/clamav-rest:latest
    container_name: trustlayer-clamav-rest
    restart: unless-stopped
    ports:
      - "8090:8080"
    environment:
      - CLAMD_HOST=clamav
      - CLAMD_PORT=3310
    depends_on:
      - clamav

volumes:
  clamav-db:
```

### Endpoint de Scan

```typescript
// Configurar endpoint
VITE_IMPORT_MALWARE_SCAN_URL=http://localhost:8090/scan

// Formato esperado de resposta
interface ScanResponse {
  clean: boolean;
  viruses?: string[];
  error?: string;
}
```

## CDN para Assets Públicos

### CloudFront (AWS)

```hcl
# terraform/cdn.tf
resource "aws_cloudfront_distribution" "storage" {
  origin {
    domain_name = aws_s3_bucket.storage.bucket_regional_domain_name
    origin_id   = "S3-trustlayer-storage"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.storage.cloudfront_access_identity_path
    }
  }

  enabled         = true
  is_ipv6_enabled = true

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-trustlayer-storage"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  # Apenas buckets públicos
  cache_behavior {
    path_pattern     = "/avatars/*"
    target_origin_id = "S3-trustlayer-storage"
    # ... configurações de cache
  }

  cache_behavior {
    path_pattern     = "/logos/*"
    target_origin_id = "S3-trustlayer-storage"
    # ... configurações de cache
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
```

### Cloudflare

```yaml
# Configuração via API ou Dashboard
zone_settings:
  ssl: "full_strict"
  min_tls_version: "1.2"

page_rules:
  - targets:
      - "cdn.trustlayer.exemplo.com/avatars/*"
    actions:
      cache_level: "cache_everything"
      edge_cache_ttl: 86400
      browser_cache_ttl: 2592000

  - targets:
      - "cdn.trustlayer.exemplo.com/logos/*"
    actions:
      cache_level: "cache_everything"
      edge_cache_ttl: 86400
```

## Backup de Storage

### Script de Backup

```bash
#!/bin/bash
# backup-storage.sh

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/storage"
S3_BUCKET="trustlayer-storage"
BACKUP_BUCKET="trustlayer-backups"

# Sync para bucket de backup
aws s3 sync s3://$S3_BUCKET s3://$BACKUP_BUCKET/storage/$BACKUP_DATE \
  --exclude "*.tmp" \
  --storage-class STANDARD_IA

# Limpar backups antigos (manter 30 dias)
aws s3 ls s3://$BACKUP_BUCKET/storage/ | while read -r line; do
  createDate=$(echo $line | awk '{print $1" "$2}')
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    folderName=$(echo $line | awk '{print $4}')
    aws s3 rm s3://$BACKUP_BUCKET/storage/$folderName --recursive
  fi
done
```

### Cron Job

```cron
# /etc/cron.d/trustlayer-backup
0 2 * * * root /opt/trustlayer/scripts/backup-storage.sh >> /var/log/trustlayer/backup-storage.log 2>&1
```

## Monitoramento

### Métricas

| Métrica | Descrição | Alerta |
|---------|-----------|--------|
| `storage_bytes_total` | Total de bytes armazenados | > 80% quota |
| `upload_rate` | Taxa de uploads/minuto | > 100/min |
| `upload_errors` | Erros de upload | > 5/min |
| `scan_failures` | Falhas no antivírus | > 0 |

### Prometheus Queries

```promql
# Uso de storage
sum(storage_bucket_size_bytes) by (bucket)

# Taxa de upload
rate(storage_uploads_total[5m])

# Taxa de erro
rate(storage_upload_errors_total[5m]) / rate(storage_uploads_total[5m])
```

## Troubleshooting

### Upload falha com erro de permissão

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'evidence';
```

### Arquivo não encontrado

```bash
# Verificar se existe no S3
aws s3 ls s3://trustlayer-storage/evidence/<path>

# Verificar permissões
aws s3api get-object-acl --bucket trustlayer-storage --key evidence/<path>
```

### Performance lenta

```bash
# Verificar latência do S3
aws s3api head-object --bucket trustlayer-storage --key test.txt

# Habilitar Transfer Acceleration
aws s3api put-bucket-accelerate-configuration \
  --bucket trustlayer-storage \
  --accelerate-configuration Status=Enabled
```

## Próximos Passos

1. [Configurar Backup](./backup-restore.md)
2. [Configurar CDN](./load-balancer.md)
3. [Monitoramento](./logging-monitoring.md)

## Referências

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Google Cloud Storage](https://cloud.google.com/storage/docs)
