---
profile: developer
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Database Schema

## Visao Geral

O TrustLayer utiliza PostgreSQL via Supabase. Este documento descreve todas as tabelas, relacionamentos e politicas de seguranca (RLS).

## Publico-Alvo

- Desenvolvedores backend
- DBAs e administradores de banco
- Arquitetos de dados

---

## 1. Diagrama ER Simplificado

```
+-------------------+       +-------------------+
|   auth.users      |       |   profiles        |
|-------------------|       |-------------------|
| id (PK)           |<------| user_id (FK)      |
| email             |       | display_name      |
| ...               |       | role              |
+-------------------+       | avatar_url        |
                            +-------------------+
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
        v                           v                           v
+-------------------+       +-------------------+       +-------------------+
|   answers         |       | maturity_snapshots|       |   change_logs     |
|-------------------|       |-------------------|       |-------------------|
| id (PK)           |       | id (PK)           |       | id (PK)           |
| user_id (FK)      |       | user_id (FK)      |       | user_id (FK)      |
| question_id       |       | domain_id         |       | entity            |
| response          |       | score             |       | action            |
| evidence          |       | created_at        |       | details           |
+-------------------+       +-------------------+       +-------------------+

+-------------------+       +-------------------+       +-------------------+
| security_domains  |       |   domains         |       | subcategories     |
|-------------------|       |-------------------|       |-------------------|
| id (PK)           |<------| security_domain_id|<------| domain_id (FK)    |
| name              |       | id (PK)           |       | id (PK)           |
| key               |       | name              |       | name              |
+-------------------+       +-------------------+       +-------------------+
                                                                |
                                                                v
                                                        +-------------------+
                                                        | default_questions |
                                                        |-------------------|
                                                        | id (PK)           |
                                                        | subcategory_id(FK)|
                                                        | text              |
                                                        | frameworks        |
                                                        +-------------------+
```

---

## 2. Tabelas de Autenticacao

### 2.1 auth.users (Supabase)

Tabela gerenciada pelo Supabase Auth.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK, ID unico do usuario |
| email | text | Email do usuario |
| encrypted_password | text | Senha hasheada |
| email_confirmed_at | timestamptz | Data de confirmacao |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### 2.2 profiles

Extensao do usuario com dados do TrustLayer.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer', 'user')),
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'default',
  language TEXT DEFAULT 'pt-BR',
  ai_assistant_enabled BOOLEAN DEFAULT true,
  audio_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Indices:**
```sql
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
```

---

## 3. Tabelas de Catalogo

### 3.1 security_domains

Dominios de seguranca de alto nivel.

```sql
CREATE TABLE security_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL, -- {"pt-BR": "Seguranca de IA", "en-US": "AI Security"}
  description JSONB,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Dados padrao:**
- `ai-security` - Seguranca de IA
- `cloud-security` - Seguranca em Nuvem
- `devsecops` - DevSecOps

### 3.2 domains

Categorias dentro de cada dominio de seguranca.

```sql
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_domain_id UUID REFERENCES security_domains(id),
  key TEXT NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(security_domain_id, key)
);
```

### 3.3 subcategories

Subcategorias dentro de cada dominio.

```sql
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id),
  key TEXT NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(domain_id, key)
);
```

### 3.4 default_questions

Perguntas padrao do sistema.

```sql
CREATE TABLE default_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID REFERENCES subcategories(id),
  text JSONB NOT NULL, -- {"pt-BR": "Pergunta...", "en-US": "Question..."}
  help_text JSONB,
  frameworks TEXT[] NOT NULL, -- ["nist-ai-rmf", "iso-42001"]
  controls JSONB, -- {"nist-ai-rmf": "GV-1.1", "iso-42001": "5.2"}
  maturity_level INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indices:**
```sql
CREATE INDEX idx_questions_subcategory ON default_questions(subcategory_id);
CREATE INDEX idx_questions_frameworks ON default_questions USING GIN(frameworks);
```

### 3.5 custom_questions

Perguntas customizadas por organizacao.

```sql
CREATE TABLE custom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  subcategory_id UUID REFERENCES subcategories(id),
  text JSONB NOT NULL,
  help_text JSONB,
  frameworks TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. Tabelas de Assessment

### 4.1 answers

Respostas dos usuarios aos assessments.

```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL, -- Referencia default_questions ou custom_questions
  question_type TEXT DEFAULT 'default' CHECK (question_type IN ('default', 'custom')),
  response TEXT CHECK (response IN ('yes', 'partial', 'no', 'na')),
  evidence TEXT,
  evidence_type TEXT CHECK (evidence_type IN ('text', 'link', 'file')),
  evidence_url TEXT,
  notes TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);
```

**Indices:**
```sql
CREATE INDEX idx_answers_user ON answers(user_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_response ON answers(response);
```

### 4.2 maturity_snapshots

Snapshots periodicos de maturidade.

```sql
CREATE TABLE maturity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  security_domain_id UUID REFERENCES security_domains(id),
  domain_id UUID REFERENCES domains(id),
  framework_id TEXT,
  total_questions INTEGER NOT NULL,
  answered_questions INTEGER NOT NULL,
  yes_count INTEGER DEFAULT 0,
  partial_count INTEGER DEFAULT 0,
  no_count INTEGER DEFAULT 0,
  na_count INTEGER DEFAULT 0,
  score DECIMAL(5,2),
  maturity_level INTEGER,
  snapshot_type TEXT DEFAULT 'auto' CHECK (snapshot_type IN ('auto', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indices:**
```sql
CREATE INDEX idx_snapshots_user ON maturity_snapshots(user_id);
CREATE INDEX idx_snapshots_created ON maturity_snapshots(created_at);
CREATE INDEX idx_snapshots_domain ON maturity_snapshots(security_domain_id);
```

---

## 5. Tabelas de Relatorios

### 5.1 report_templates

Templates de relatorios.

```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'executive_summary', 'compliance_status', 'gap_analysis',
    'trend_analysis', 'risk_assessment', 'audit_log', 'custom'
  )),
  config JSONB NOT NULL, -- Configuracao de secoes, graficos, filtros
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'global')),
  allowed_roles TEXT[],
  is_system_template BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5.2 report_schedules

Agendamentos de relatorios.

```sql
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL, -- '0 9 * * 1' (Monday 9AM)
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  enabled BOOLEAN NOT NULL DEFAULT true,
  filters JSONB, -- Filtros dinamicos
  output_formats TEXT[] NOT NULL DEFAULT '{"pdf"}',
  recipients TEXT[] NOT NULL,
  cc TEXT[],
  bcc TEXT[],
  subject_template TEXT,
  body_template TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indices:**
```sql
CREATE INDEX idx_schedules_next_run ON report_schedules(next_run_at) WHERE enabled = true;
CREATE INDEX idx_schedules_org ON report_schedules(organization_id);
```

### 5.3 report_runs

Historico de execucoes de relatorios.

```sql
CREATE TABLE report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  template_id UUID REFERENCES report_templates(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  output_files JSONB, -- [{"format": "pdf", "url": "...", "size": 1024}]
  filters_used JSONB,
  data_snapshot JSONB, -- Snapshot dos dados no momento da geracao
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. Tabelas de Auditoria

### 6.1 change_logs

Log de todas as alteracoes no sistema.

```sql
CREATE TABLE change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB, -- {"country": "BR", "city": "Sao Paulo", "lat": -23.5, "lon": -46.6}
  device_fingerprint TEXT,
  session_id TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indices:**
```sql
CREATE INDEX idx_change_logs_user ON change_logs(user_id);
CREATE INDEX idx_change_logs_entity ON change_logs(entity, entity_id);
CREATE INDEX idx_change_logs_action ON change_logs(action);
CREATE INDEX idx_change_logs_created ON change_logs(created_at);
```

**Particionamento (opcional para alto volume):**
```sql
-- Particionar por mes
CREATE TABLE change_logs_2026_01 PARTITION OF change_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## 7. Tabelas de Configuracao

### 7.1 ai_providers

Configuracao de provedores de IA.

```sql
CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('openai', 'claude', 'gemini', 'ollama', 'custom')),
  api_endpoint TEXT,
  api_key_reference TEXT, -- Referencia ao secret manager
  model TEXT,
  config JSONB, -- Configuracoes especificas do provider
  is_default BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7.2 siem_integrations

Configuracao de integracoes SIEM.

```sql
CREATE TABLE siem_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('splunk', 'elasticsearch', 'qradar', 'arcsight', 'custom')),
  endpoint_url TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'cef', 'leef', 'syslog')),
  auth_type TEXT CHECK (auth_type IN ('none', 'basic', 'bearer', 'api_key')),
  auth_config JSONB, -- Credenciais criptografadas
  filters JSONB, -- Filtros de eventos a enviar
  enabled BOOLEAN DEFAULT true,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7.3 global_settings

Configuracoes globais do sistema.

```sql
CREATE TABLE global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8. Row Level Security (RLS)

### 8.1 Politicas de profiles

```sql
-- Usuarios podem ver seu proprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios podem atualizar seu proprio perfil (exceto role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    role = (SELECT role FROM profiles WHERE user_id = auth.uid())
  );

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### 8.2 Politicas de answers

```sql
-- Usuarios podem ver suas proprias respostas
CREATE POLICY "Users can view own answers"
  ON answers FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios (exceto viewer) podem inserir/atualizar respostas
CREATE POLICY "Users can insert answers"
  ON answers FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role != 'viewer'
    )
  );

CREATE POLICY "Users can update own answers"
  ON answers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role != 'viewer'
    )
  );
```

### 8.3 Politicas de change_logs

```sql
-- Somente auditores e admins podem ver logs
CREATE POLICY "Auditors can view logs"
  ON change_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'auditor')
    )
  );

-- Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert logs"
  ON change_logs FOR INSERT
  WITH CHECK (true); -- Controlado via service role
```

---

## 9. Funcoes e Triggers

### 9.1 Atualizacao automatica de updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 9.2 Log automatico de alteracoes

```sql
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO change_logs (user_id, entity, action, entity_id, old_value, new_value)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_answers_log
  AFTER INSERT OR UPDATE OR DELETE ON answers
  FOR EACH ROW EXECUTE FUNCTION log_changes();
```

---

## 10. Migrations

As migrations estao em `supabase/migrations/` e sao executadas automaticamente pelo Supabase CLI.

**Estrutura de arquivos:**
```
supabase/migrations/
├── 20260101000000_initial_schema.sql
├── 20260115000000_add_reporting.sql
├── 20260120000000_add_advanced_reporting.sql
├── 20260120100000_add_user_avatars.sql
└── ...
```

**Executando migrations localmente:**
```bash
supabase db reset
supabase db push
```

---

## Referencias

- [API Reference](api-reference.md)
- [Arquitetura](architecture.md)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)

---

*Ultima atualizacao: 20 de Janeiro de 2026*
