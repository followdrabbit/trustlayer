import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL)');
}
if (!serviceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const loadJson = async (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  const raw = await readFile(fileUrl, 'utf8');
  return JSON.parse(raw);
};

const taxonomy = await loadJson('../src/data/taxonomy.json');
const questionsAi = await loadJson('../src/data/questions.json');
const cloudTaxonomy = await loadJson('../src/data/cloud-security-taxonomy.json');
const cloudQuestions = await loadJson('../src/data/cloud-security-questions.json');
const devsecopsTaxonomy = await loadJson('../src/data/devsecops-taxonomy.json');
const devsecopsQuestions = await loadJson('../src/data/devsecops-questions.json');
const frameworksConfig = await loadJson('../src/data/frameworks.json');

const securityDomains = [
  {
    domain_id: 'AI_SECURITY',
    domain_name: 'AI Security',
    short_name: 'AI Sec',
    description: 'AI security governance, data, runtime, and risk management',
    icon: 'brain',
    display_order: 1,
    is_enabled: true,
    color: 'purple',
  },
  {
    domain_id: 'CLOUD_SECURITY',
    domain_name: 'Cloud Security',
    short_name: 'Cloud Sec',
    description: 'Cloud security controls, posture, and resilience',
    icon: 'cloud',
    display_order: 2,
    is_enabled: true,
    color: 'blue',
  },
  {
    domain_id: 'DEVSECOPS',
    domain_name: 'DevSecOps Security',
    short_name: 'DevSecOps',
    description: 'Secure software delivery and pipeline security',
    icon: 'code',
    display_order: 3,
    is_enabled: true,
    color: 'green',
  },
];

const mapDomain = (d, securityDomainId) => ({
  domain_id: d.domainId,
  domain_name: d.domainName,
  display_order: d.order ?? 0,
  nist_ai_rmf_function: d.nistAiRmfFunction ?? null,
  strategic_question: d.strategicQuestion ?? null,
  description: d.description ?? null,
  banking_relevance: d.bankingRelevance ?? null,
  security_domain_id: d.securityDomainId ?? securityDomainId ?? null,
});

const mapSubcategory = (s, securityDomainId) => ({
  subcat_id: s.subcatId,
  domain_id: s.domainId,
  subcat_name: s.subcatName,
  definition: s.definition ?? null,
  objective: s.objective ?? null,
  security_outcome: s.securityOutcome ?? null,
  criticality: s.criticality ?? null,
  weight: s.weight ?? null,
  ownership_type: s.ownershipType ?? null,
  risk_summary: s.riskSummary ?? null,
  framework_refs: s.frameworkRefs ?? null,
  security_domain_id: s.securityDomainId ?? securityDomainId ?? null,
});

const mapQuestion = (q, securityDomainId) => ({
  question_id: q.questionId,
  subcat_id: q.subcatId,
  domain_id: q.domainId,
  question_text: q.questionText,
  expected_evidence: q.expectedEvidence ?? null,
  imperative_checks: q.imperativeChecks ?? null,
  risk_summary: q.riskSummary ?? null,
  frameworks: q.frameworks ?? [],
  ownership_type: q.ownershipType ?? null,
  security_domain_id: q.securityDomainId ?? securityDomainId ?? null,
});

const mapFramework = (f) => ({
  framework_id: f.frameworkId,
  framework_name: f.frameworkName,
  short_name: f.shortName,
  description: f.description ?? null,
  target_audience: f.targetAudience ?? [],
  assessment_scope: f.assessmentScope ?? null,
  default_enabled: f.defaultEnabled ?? false,
  version: f.version ?? null,
  category: f.category ?? null,
  reference_links: f.references ?? [],
  security_domain_id: f.securityDomainId ?? null,
});

const domains = [
  ...(taxonomy.domains || []).map((d) => mapDomain(d, 'AI_SECURITY')),
  ...(cloudTaxonomy.domains || []).map((d) => mapDomain(d, 'CLOUD_SECURITY')),
  ...(devsecopsTaxonomy.domains || []).map((d) => mapDomain(d, 'DEVSECOPS')),
];

const subcategories = [
  ...(taxonomy.subcategories || []).map((s) => mapSubcategory(s, 'AI_SECURITY')),
  ...(cloudTaxonomy.subcategories || []).map((s) => mapSubcategory(s, 'CLOUD_SECURITY')),
  ...(devsecopsTaxonomy.subcategories || []).map((s) => mapSubcategory(s, 'DEVSECOPS')),
];

const questions = [
  ...((questionsAi.questions || []).map((q) => mapQuestion(q, 'AI_SECURITY'))),
  ...((cloudQuestions.questions || []).map((q) => mapQuestion(q, 'CLOUD_SECURITY'))),
  ...((devsecopsQuestions.questions || []).map((q) => mapQuestion(q, 'DEVSECOPS'))),
];

const frameworks = (frameworksConfig.frameworks || []).map(mapFramework);

const upsertBatch = async (table, rows, onConflict) => {
  if (!rows.length) return;
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) throw error;
  }
};

await upsertBatch('security_domains', securityDomains, 'domain_id');
await upsertBatch('domains', domains, 'domain_id');
await upsertBatch('subcategories', subcategories, 'subcat_id');
await upsertBatch('default_frameworks', frameworks, 'framework_id');
await upsertBatch('default_questions', questions, 'question_id');

console.log('Seed complete:', {
  security_domains: securityDomains.length,
  domains: domains.length,
  subcategories: subcategories.length,
  default_frameworks: frameworks.length,
  default_questions: questions.length,
});
