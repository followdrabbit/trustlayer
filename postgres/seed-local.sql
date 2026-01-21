-- =============================================================================
-- TrustLayer - Seed Data para Desenvolvimento Local
-- =============================================================================
-- Este arquivo é carregado automaticamente pelo docker-compose.local.yml
-- Cria dados iniciais para facilitar o desenvolvimento
-- =============================================================================

-- Aguardar extensões estarem disponíveis
DO $$
BEGIN
    -- Garantir que uuid-ossp está disponível
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION "uuid-ossp";
    END IF;
END $$;

-- =============================================================================
-- Domínios de Segurança
-- =============================================================================
INSERT INTO security_domains (id, name, description, icon, color, enabled, created_at)
VALUES
    ('ai-security', 'AI Security', 'Segurança de Inteligência Artificial baseada em NIST AI RMF e ISO 23894', 'brain', '#8B5CF6', true, NOW()),
    ('cloud-security', 'Cloud Security', 'Segurança em Nuvem baseada em CSA CCM e ISO 27017', 'cloud', '#0EA5E9', true, NOW()),
    ('devsecops', 'DevSecOps', 'Segurança no Ciclo de Desenvolvimento baseada em NIST SSDF e OWASP', 'code', '#10B981', true, NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    enabled = EXCLUDED.enabled;

-- =============================================================================
-- Frameworks Padrão
-- =============================================================================
INSERT INTO default_frameworks (id, name, description, version, source_url, security_domain_id, enabled, created_at)
VALUES
    -- AI Security
    (uuid_generate_v4(), 'NIST AI RMF', 'NIST Artificial Intelligence Risk Management Framework', '1.0', 'https://www.nist.gov/itl/ai-risk-management-framework', 'ai-security', true, NOW()),
    (uuid_generate_v4(), 'ISO/IEC 23894', 'Information technology - AI risk management', '2023', 'https://www.iso.org/standard/77304.html', 'ai-security', true, NOW()),
    (uuid_generate_v4(), 'EU AI Act', 'European Union Artificial Intelligence Act', '2024', 'https://artificialintelligenceact.eu/', 'ai-security', true, NOW()),

    -- Cloud Security
    (uuid_generate_v4(), 'CSA CCM', 'Cloud Security Alliance Cloud Controls Matrix', 'v4.0', 'https://cloudsecurityalliance.org/research/cloud-controls-matrix/', 'cloud-security', true, NOW()),
    (uuid_generate_v4(), 'ISO 27017', 'Code of practice for information security controls for cloud services', '2015', 'https://www.iso.org/standard/43757.html', 'cloud-security', true, NOW()),
    (uuid_generate_v4(), 'CIS Benchmarks', 'Center for Internet Security Cloud Benchmarks', '2024', 'https://www.cisecurity.org/cis-benchmarks', 'cloud-security', true, NOW()),

    -- DevSecOps
    (uuid_generate_v4(), 'NIST SSDF', 'Secure Software Development Framework', '1.1', 'https://csrc.nist.gov/publications/detail/sp/800-218/final', 'devsecops', true, NOW()),
    (uuid_generate_v4(), 'OWASP SAMM', 'Software Assurance Maturity Model', '2.0', 'https://owaspsamm.org/', 'devsecops', true, NOW()),
    (uuid_generate_v4(), 'SLSA', 'Supply-chain Levels for Software Artifacts', '1.0', 'https://slsa.dev/', 'devsecops', true, NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Configuração de Licença para Desenvolvimento
-- =============================================================================
-- Em desenvolvimento, todas as features estão habilitadas

-- =============================================================================
-- Log de Inicialização
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'TrustLayer - Seed local aplicado com sucesso!';
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Domínios de segurança: AI Security, Cloud Security, DevSecOps';
    RAISE NOTICE 'Frameworks padrão: NIST AI RMF, CSA CCM, NIST SSDF, etc.';
    RAISE NOTICE '=============================================================';
END $$;
