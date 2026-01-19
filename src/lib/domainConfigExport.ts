/**
 * Domain Configuration Export/Import
 * 
 * Handles exporting and importing complete security domain configurations
 * including taxonomy (domains, subcategories), frameworks, and questions.
 */

import ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';
import { SecurityDomain } from './securityDomains';
import { logAuditEvent } from './auditLog';
import { scanXlsxFile } from './xlsxSecurity';

const SCHEMA_VERSION = '1.0.0';
const TEMPLATE_VERSION = '1.0.0';
const CONFIG_TYPE = 'SECURITY_DOMAIN_CONFIG';
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const JSON_MIME_TYPE = 'application/json';
const MAX_IMPORT_FILE_BYTES = Number.parseInt(
  import.meta.env.VITE_IMPORT_MAX_FILE_BYTES || '',
  10
) || 5 * 1024 * 1024;
const MAX_IMPORT_CELL_CHARS = Number.parseInt(
  import.meta.env.VITE_IMPORT_MAX_CELL_CHARS || '',
  10
) || 2000;
const ALLOWED_IMPORT_EXTENSIONS = ['.json', '.xlsx'];
const XLSX_SHEET_LIMITS = {
  metadata: 5,
  securityDomain: 5,
  taxonomyDomains: 200,
  subcategories: 2000,
  frameworks: 500,
  questions: 5000,
};
const PREVIEW_SAMPLE_LIMIT = 3;
const PREVIEW_WARNING_LIMIT = 5;

// Export interfaces
export interface DomainConfigExport {
  metadata: DomainConfigMetadata;
  securityDomain: SecurityDomainConfig;
  taxonomy: TaxonomyConfig;
  frameworks: FrameworkConfig[];
  questions: QuestionConfig[];
}

export interface DomainConfigMetadata {
  schemaVersion: string;
  templateVersion?: string;
  configType: string;
  exportedAt: string;
  sourceDomainId: string;
  sourceDomainName: string;
}

export interface SecurityDomainConfig {
  domainId: string;
  domainName: string;
  shortName: string;
  description: string;
  color: string;
  icon: string;
  displayOrder: number;
}

export interface TaxonomyDomainConfig {
  domainId: string;
  domainName: string;
  description: string | null;
  displayOrder: number | null;
  nistAiRmfFunction: string | null;
  bankingRelevance: string | null;
  strategicQuestion: string | null;
}

export interface TaxonomySubcategoryConfig {
  subcatId: string;
  subcatName: string;
  domainId: string;
  definition: string | null;
  objective: string | null;
  criticality: string | null;
  ownershipType: string | null;
  riskSummary: string | null;
  securityOutcome: string | null;
  weight: number | null;
  frameworkRefs: string[] | null;
}

export interface TaxonomyConfig {
  domains: TaxonomyDomainConfig[];
  subcategories: TaxonomySubcategoryConfig[];
}

export interface FrameworkConfig {
  frameworkId: string;
  frameworkName: string;
  shortName: string;
  version: string | null;
  description: string | null;
  category: string | null;
  targetAudience: string[] | null;
  assessmentScope: string | null;
  referenceLinks: string[] | null;
  defaultEnabled: boolean | null;
}

export interface QuestionConfig {
  questionId: string;
  questionText: string;
  domainId: string;
  subcatId: string | null;
  criticality: string | null;
  ownershipType: string | null;
  riskSummary: string | null;
  expectedEvidence: string | null;
  imperativeChecks: string | null;
  frameworks: string[] | null;
}

// Import result interface
export interface ImportResult {
  success: boolean;
  domainId: string | null;
  warnings: string[];
  errors: string[];
  stats: {
    taxonomyDomains: number;
    subcategories: number;
    frameworks: number;
    questions: number;
  };
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: DomainConfigExport | null;
  preview?: DomainImportPreview | null;
}

export interface DomainImportPreviewItem {
  id: string;
  label: string;
}

export interface DomainImportPreview {
  samples: {
    taxonomyDomains: DomainImportPreviewItem[];
    subcategories: DomainImportPreviewItem[];
    frameworks: DomainImportPreviewItem[];
    questions: DomainImportPreviewItem[];
  };
  warnings: string[];
}

/**
 * Export a complete security domain configuration
 */
export async function exportDomainConfig(securityDomainId: string): Promise<DomainConfigExport | null> {
  try {
    // Get security domain
    const { data: secDomain, error: secDomainError } = await supabase
      .from('security_domains')
      .select('*')
      .eq('domain_id', securityDomainId)
      .single();

    if (secDomainError || !secDomain) {
      console.error('Error fetching security domain:', secDomainError);
      return null;
    }

    // Get taxonomy domains
    const { data: taxDomains, error: taxDomainsError } = await supabase
      .from('domains')
      .select('*')
      .eq('security_domain_id', securityDomainId)
      .order('display_order', { ascending: true });

    if (taxDomainsError) {
      console.error('Error fetching taxonomy domains:', taxDomainsError);
      return null;
    }

    // Get subcategories
    const { data: subcategories, error: subcatsError } = await supabase
      .from('subcategories')
      .select('*')
      .eq('security_domain_id', securityDomainId);

    if (subcatsError) {
      console.error('Error fetching subcategories:', subcatsError);
      return null;
    }

    // Get custom frameworks
    const { data: customFrameworks, error: fwError } = await supabase
      .from('custom_frameworks')
      .select('*')
      .eq('security_domain_id', securityDomainId);

    if (fwError) {
      console.error('Error fetching custom frameworks:', fwError);
    }

    // Get default frameworks for this domain
    const { data: defaultFrameworks, error: dfwError } = await supabase
      .from('default_frameworks')
      .select('*')
      .eq('security_domain_id', securityDomainId);

    if (dfwError) {
      console.error('Error fetching default frameworks:', dfwError);
    }

    // Get custom questions
    const { data: customQuestions, error: cqError } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('security_domain_id', securityDomainId);

    if (cqError) {
      console.error('Error fetching custom questions:', cqError);
    }

    // Get default questions for this domain
    const { data: defaultQuestions, error: dqError } = await supabase
      .from('default_questions')
      .select('*')
      .eq('security_domain_id', securityDomainId);

    if (dqError) {
      console.error('Error fetching default questions:', dqError);
    }

    // Build export object
    const config: DomainConfigExport = {
      metadata: {
        schemaVersion: SCHEMA_VERSION,
        configType: CONFIG_TYPE,
        exportedAt: new Date().toISOString(),
        sourceDomainId: securityDomainId,
        sourceDomainName: secDomain.domain_name
      },
      securityDomain: {
        domainId: secDomain.domain_id,
        domainName: secDomain.domain_name,
        shortName: secDomain.short_name,
        description: secDomain.description || '',
        color: secDomain.color || 'blue',
        icon: secDomain.icon || 'shield',
        displayOrder: secDomain.display_order || 1
      },
      taxonomy: {
        domains: (taxDomains || []).map(d => ({
          domainId: d.domain_id,
          domainName: d.domain_name,
          description: d.description,
          displayOrder: d.display_order,
          nistAiRmfFunction: d.nist_ai_rmf_function,
          bankingRelevance: d.banking_relevance,
          strategicQuestion: d.strategic_question
        })),
        subcategories: (subcategories || []).map(s => ({
          subcatId: s.subcat_id,
          subcatName: s.subcat_name,
          domainId: s.domain_id,
          definition: s.definition,
          objective: s.objective,
          criticality: s.criticality,
          ownershipType: s.ownership_type,
          riskSummary: s.risk_summary,
          securityOutcome: s.security_outcome,
          weight: s.weight,
          frameworkRefs: s.framework_refs
        }))
      },
      frameworks: [
        ...(customFrameworks || []).map(f => ({
          frameworkId: f.framework_id,
          frameworkName: f.framework_name,
          shortName: f.short_name,
          version: f.version,
          description: f.description,
          category: f.category,
          targetAudience: f.target_audience,
          assessmentScope: f.assessment_scope,
          referenceLinks: f.reference_links,
          defaultEnabled: f.default_enabled
        })),
        ...(defaultFrameworks || []).map(f => ({
          frameworkId: f.framework_id,
          frameworkName: f.framework_name,
          shortName: f.short_name,
          version: f.version,
          description: f.description,
          category: f.category,
          targetAudience: f.target_audience,
          assessmentScope: f.assessment_scope,
          referenceLinks: f.reference_links,
          defaultEnabled: f.default_enabled
        }))
      ],
      questions: [
        ...(customQuestions || []).map(q => ({
          questionId: q.question_id,
          questionText: q.question_text,
          domainId: q.domain_id,
          subcatId: q.subcat_id,
          criticality: q.criticality,
          ownershipType: q.ownership_type,
          riskSummary: q.risk_summary,
          expectedEvidence: q.expected_evidence,
          imperativeChecks: q.imperative_checks,
          frameworks: q.frameworks
        })),
        ...(defaultQuestions || []).map(q => ({
          questionId: q.question_id,
          questionText: q.question_text,
          domainId: q.domain_id,
          subcatId: q.subcat_id,
          criticality: null,
          ownershipType: q.ownership_type,
          riskSummary: q.risk_summary,
          expectedEvidence: q.expected_evidence,
          imperativeChecks: q.imperative_checks,
          frameworks: q.frameworks
        }))
      ]
    };

    return config;
  } catch (error) {
    console.error('Error exporting domain config:', error);
    return null;
  }
}

/**
 * Download domain config as JSON file
 */
export function downloadDomainConfig(config: DomainConfigExport): void {
  const jsonStr = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `domain-config-${config.securityDomain.shortName.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.json`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function generateDomainConfigTemplate(): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TrustLayer';
  workbook.created = new Date();

  const metadataSheet = workbook.addWorksheet('Metadata');
  metadataSheet.columns = [
    { header: 'schemaVersion', key: 'schemaVersion', width: 15 },
    { header: 'templateVersion', key: 'templateVersion', width: 15 },
    { header: 'configType', key: 'configType', width: 25 },
    { header: 'exportedAt', key: 'exportedAt', width: 25 },
    { header: 'sourceDomainId', key: 'sourceDomainId', width: 20 },
    { header: 'sourceDomainName', key: 'sourceDomainName', width: 30 },
  ];
  metadataSheet.addRow({
    schemaVersion: SCHEMA_VERSION,
    templateVersion: TEMPLATE_VERSION,
    configType: CONFIG_TYPE,
    exportedAt: new Date().toISOString(),
    sourceDomainId: 'EXAMPLE_DOMAIN',
    sourceDomainName: 'Example Domain',
  });

  const securitySheet = workbook.addWorksheet('SecurityDomain');
  securitySheet.columns = [
    { header: 'domainId', key: 'domainId', width: 20 },
    { header: 'domainName', key: 'domainName', width: 30 },
    { header: 'shortName', key: 'shortName', width: 20 },
    { header: 'description', key: 'description', width: 40 },
    { header: 'color', key: 'color', width: 12 },
    { header: 'icon', key: 'icon', width: 12 },
    { header: 'displayOrder', key: 'displayOrder', width: 12 },
  ];
  securitySheet.addRow({
    domainId: 'EXAMPLE_DOMAIN',
    domainName: 'Example Domain',
    shortName: 'Example',
    description: 'Example security domain',
    color: 'blue',
    icon: 'shield',
    displayOrder: 1,
  });

  const taxonomyDomainSheet = workbook.addWorksheet('TaxonomyDomains');
  taxonomyDomainSheet.columns = [
    { header: 'domainId', key: 'domainId', width: 20 },
    { header: 'domainName', key: 'domainName', width: 30 },
    { header: 'description', key: 'description', width: 40 },
    { header: 'displayOrder', key: 'displayOrder', width: 12 },
    { header: 'nistAiRmfFunction', key: 'nistAiRmfFunction', width: 20 },
    { header: 'bankingRelevance', key: 'bankingRelevance', width: 20 },
    { header: 'strategicQuestion', key: 'strategicQuestion', width: 40 },
  ];
  taxonomyDomainSheet.addRow({
    domainId: 'EXAMPLE_DOMAIN_GOV',
    domainName: 'Governance',
    description: 'Example taxonomy domain',
    displayOrder: 1,
    nistAiRmfFunction: 'GOVERN',
  });

  const subcatSheet = workbook.addWorksheet('Subcategories');
  subcatSheet.columns = [
    { header: 'subcatId', key: 'subcatId', width: 20 },
    { header: 'subcatName', key: 'subcatName', width: 30 },
    { header: 'domainId', key: 'domainId', width: 20 },
    { header: 'definition', key: 'definition', width: 40 },
    { header: 'objective', key: 'objective', width: 40 },
    { header: 'criticality', key: 'criticality', width: 12 },
    { header: 'ownershipType', key: 'ownershipType', width: 15 },
    { header: 'riskSummary', key: 'riskSummary', width: 40 },
    { header: 'securityOutcome', key: 'securityOutcome', width: 40 },
    { header: 'weight', key: 'weight', width: 10 },
    { header: 'frameworkRefs', key: 'frameworkRefs', width: 30 },
  ];
  subcatSheet.addRow({
    subcatId: 'EXAMPLE_SUB_001',
    subcatName: 'Policies',
    domainId: 'EXAMPLE_DOMAIN_GOV',
    definition: 'Example definition',
    objective: 'Example objective',
    criticality: 'High',
    ownershipType: 'GRC',
    riskSummary: 'Example risk summary',
    securityOutcome: 'Example outcome',
    weight: 1,
    frameworkRefs: 'ISO_27001|NIST_CSF',
  });

  const frameworksSheet = workbook.addWorksheet('Frameworks');
  frameworksSheet.columns = [
    { header: 'frameworkId', key: 'frameworkId', width: 20 },
    { header: 'frameworkName', key: 'frameworkName', width: 30 },
    { header: 'shortName', key: 'shortName', width: 15 },
    { header: 'version', key: 'version', width: 10 },
    { header: 'description', key: 'description', width: 40 },
    { header: 'category', key: 'category', width: 20 },
    { header: 'targetAudience', key: 'targetAudience', width: 30 },
    { header: 'assessmentScope', key: 'assessmentScope', width: 30 },
    { header: 'referenceLinks', key: 'referenceLinks', width: 40 },
    { header: 'defaultEnabled', key: 'defaultEnabled', width: 15 },
  ];
  frameworksSheet.addRow({
    frameworkId: 'EXAMPLE_FRAMEWORK',
    frameworkName: 'Example Framework',
    shortName: 'EXAMPLE',
    version: '1.0',
    category: 'Reference',
    targetAudience: 'Executive|GRC',
    assessmentScope: 'Example scope',
    referenceLinks: 'https://example.com',
    defaultEnabled: 'true',
  });

  const questionsSheet = workbook.addWorksheet('Questions');
  questionsSheet.columns = [
    { header: 'questionId', key: 'questionId', width: 20 },
    { header: 'questionText', key: 'questionText', width: 60 },
    { header: 'domainId', key: 'domainId', width: 20 },
    { header: 'subcatId', key: 'subcatId', width: 20 },
    { header: 'criticality', key: 'criticality', width: 12 },
    { header: 'ownershipType', key: 'ownershipType', width: 15 },
    { header: 'riskSummary', key: 'riskSummary', width: 40 },
    { header: 'expectedEvidence', key: 'expectedEvidence', width: 40 },
    { header: 'imperativeChecks', key: 'imperativeChecks', width: 40 },
    { header: 'frameworks', key: 'frameworks', width: 30 },
  ];
  questionsSheet.addRow({
    questionId: 'EXAMPLE_Q_001',
    questionText: 'Does the organization maintain documented security policies?',
    domainId: 'EXAMPLE_DOMAIN_GOV',
    subcatId: 'EXAMPLE_SUB_001',
    criticality: 'High',
    ownershipType: 'GRC',
    riskSummary: 'Missing policies increases compliance risk',
    expectedEvidence: 'Approved security policy document',
    imperativeChecks: 'Verify approval date and signatures',
    frameworks: 'EXAMPLE_FRAMEWORK',
  });

  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.columns = [
    { header: 'Sheet', key: 'Sheet', width: 20 },
    { header: 'Field', key: 'Field', width: 20 },
    { header: 'Description', key: 'Description', width: 60 },
    { header: 'Required', key: 'Required', width: 10 },
  ];
  const instructions = [
    { Sheet: 'Metadata', Field: 'templateVersion', Description: 'Template version for compatibility checks', Required: 'no' },
    { Sheet: 'SecurityDomain', Field: 'domainId', Description: 'Unique ID for the security domain', Required: 'yes' },
    { Sheet: 'SecurityDomain', Field: 'domainName', Description: 'Display name for the security domain', Required: 'yes' },
    { Sheet: 'SecurityDomain', Field: 'shortName', Description: 'Short display name', Required: 'yes' },
    { Sheet: 'TaxonomyDomains', Field: 'domainId', Description: 'Unique ID for taxonomy domain', Required: 'yes' },
    { Sheet: 'Subcategories', Field: 'subcatId', Description: 'Unique ID for subcategory', Required: 'yes' },
    { Sheet: 'Frameworks', Field: 'frameworkId', Description: 'Unique ID for framework', Required: 'yes' },
    { Sheet: 'Questions', Field: 'questionId', Description: 'Unique ID for question', Required: 'yes' },
  ];
  instructions.forEach(row => instructionsSheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: XLSX_MIME_TYPE });
}

export async function downloadDomainConfigTemplate(): Promise<void> {
  const blob = await generateDomainConfigTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'domain-config-template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getFileExtension(filename: string): string {
  const match = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : '';
}

function normalizeText(value: string): string {
  return value.trim();
}

function parseList(value: string): string[] | null {
  if (!value) return null;
  const parts = value
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (['true', 'yes', '1', 'sim'].includes(normalized)) return true;
  if (['false', 'no', '0', 'nao'].includes(normalized)) return false;
  return null;
}

function parseNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function findDuplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (!value) return;
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  });
  return Array.from(duplicates);
}

function formatIdList(values: string[], limit = PREVIEW_WARNING_LIMIT): string {
  const unique = uniqueValues(values);
  if (unique.length <= limit) {
    return unique.join(', ');
  }
  return `${unique.slice(0, limit).join(', ')} +${unique.length - limit} more`;
}

function buildPreviewItems<T>(
  items: T[],
  getLabel: (item: T) => string,
  getId: (item: T) => string
): DomainImportPreviewItem[] {
  return items.slice(0, PREVIEW_SAMPLE_LIMIT).map((item) => {
    const label = getLabel(item);
    const id = getId(item);
    return {
      id,
      label: label || id,
    };
  });
}

export function buildDomainImportPreview(config: DomainConfigExport): DomainImportPreview {
  const taxonomyDomains = config.taxonomy?.domains || [];
  const subcategories = config.taxonomy?.subcategories || [];
  const frameworks = config.frameworks || [];
  const questions = config.questions || [];

  const taxonomyIds = taxonomyDomains.map((d) => d.domainId).filter(Boolean);
  const subcatIds = subcategories.map((s) => s.subcatId).filter(Boolean);
  const frameworkIds = frameworks.map((f) => f.frameworkId).filter(Boolean);
  const questionIds = questions.map((q) => q.questionId).filter(Boolean);

  const warnings: string[] = [];

  const duplicateTaxonomyIds = findDuplicateValues(taxonomyIds);
  if (duplicateTaxonomyIds.length > 0) {
    warnings.push(`Duplicate taxonomy domain IDs: ${formatIdList(duplicateTaxonomyIds)}`);
  }

  const duplicateSubcatIds = findDuplicateValues(subcatIds);
  if (duplicateSubcatIds.length > 0) {
    warnings.push(`Duplicate subcategory IDs: ${formatIdList(duplicateSubcatIds)}`);
  }

  const duplicateFrameworkIds = findDuplicateValues(frameworkIds);
  if (duplicateFrameworkIds.length > 0) {
    warnings.push(`Duplicate framework IDs: ${formatIdList(duplicateFrameworkIds)}`);
  }

  const duplicateQuestionIds = findDuplicateValues(questionIds);
  if (duplicateQuestionIds.length > 0) {
    warnings.push(`Duplicate question IDs: ${formatIdList(duplicateQuestionIds)}`);
  }

  const taxonomyIdSet = new Set(taxonomyIds);
  const missingTaxonomyForSubcats = uniqueValues(
    subcategories
      .map((s) => s.domainId)
      .filter((id) => id && !taxonomyIdSet.has(id))
  );
  if (missingTaxonomyForSubcats.length > 0) {
    warnings.push(`Subcategories reference missing taxonomy domains: ${formatIdList(missingTaxonomyForSubcats)}`);
  }

  const missingQuestionDomains = uniqueValues(
    questions
      .map((q) => q.domainId)
      .filter((id) => id && !taxonomyIdSet.has(id))
  );
  if (missingQuestionDomains.length > 0) {
    warnings.push(`Questions reference missing taxonomy domains: ${formatIdList(missingQuestionDomains)}`);
  }

  const subcatIdSet = new Set(subcatIds);
  const missingQuestionSubcats = uniqueValues(
    questions
      .map((q) => q.subcatId || '')
      .filter((id) => id && !subcatIdSet.has(id))
  );
  if (missingQuestionSubcats.length > 0) {
    warnings.push(`Questions reference missing subcategories: ${formatIdList(missingQuestionSubcats)}`);
  }

  const frameworkIdSet = new Set(frameworkIds);
  const missingFrameworkRefs = uniqueValues(
    questions
      .flatMap((q) => q.frameworks || [])
      .filter((id) => id && !frameworkIdSet.has(id))
  );
  if (missingFrameworkRefs.length > 0) {
    warnings.push(`Questions reference missing frameworks: ${formatIdList(missingFrameworkRefs)}`);
  }

  return {
    samples: {
      taxonomyDomains: buildPreviewItems(
        taxonomyDomains,
        (item) => item.domainName,
        (item) => item.domainId
      ),
      subcategories: buildPreviewItems(
        subcategories,
        (item) => item.subcatName,
        (item) => item.subcatId
      ),
      frameworks: buildPreviewItems(
        frameworks,
        (item) => item.frameworkName,
        (item) => item.frameworkId
      ),
      questions: buildPreviewItems(
        questions,
        (item) => item.questionText,
        (item) => item.questionId
      ),
    },
    warnings,
  };
}

async function readWorkbookFromFile(file: File): Promise<ExcelJS.Workbook> {
  const rawData = typeof file.arrayBuffer === 'function'
    ? await file.arrayBuffer()
    : await new Response(file).arrayBuffer();
  const data = rawData instanceof ArrayBuffer
    ? rawData
    : rawData instanceof Uint8Array
      ? rawData
      : new Uint8Array(rawData as ArrayBuffer);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  return workbook;
}

function getHeaders(worksheet: ExcelJS.Worksheet): string[] {
  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = normalizeText(cell.text || '');
  });
  return headers;
}

function readSheetRecords(
  worksheet: ExcelJS.Worksheet | undefined,
  sheetName: string,
  requiredColumns: string[],
  maxRows: number
): { records: Record<string, string>[]; errors: string[]; warnings: string[] } {
  const records: Record<string, string>[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!worksheet) {
    errors.push(`Missing sheet: ${sheetName}`);
    return { records, errors, warnings };
  }

  const totalRows = worksheet.actualRowCount || worksheet.rowCount;
  const dataRows = Math.max(0, totalRows - 1);
  if (dataRows > maxRows) {
    errors.push(`Sheet ${sheetName} exceeds max rows (${dataRows}/${maxRows})`);
  }

  const headers = getHeaders(worksheet);
  const headerMap = new Map<string, string>();
  headers.forEach((header) => {
    if (header) headerMap.set(header.toLowerCase(), header);
  });

  requiredColumns.forEach((col) => {
    if (!headerMap.has(col.toLowerCase())) {
      errors.push(`Missing column "${col}" in ${sheetName}`);
    }
  });

  for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const record: Record<string, string> = {};
    let hasValue = false;

    headers.forEach((header, index) => {
      if (!header) return;
      const cell = row.getCell(index + 1);
      const cellValue = cell.value as { formula?: string } | null;
      if (cellValue && typeof cellValue === 'object' && 'formula' in cellValue) {
        errors.push(`Formula not allowed in ${sheetName} row ${rowNumber}`);
      }
      const text = normalizeText(cell.text || '');
      if (text.length > MAX_IMPORT_CELL_CHARS) {
        errors.push(`Cell too long in ${sheetName} row ${rowNumber}`);
      }
      if (text) {
        hasValue = true;
      }
      record[header] = text;
    });

    if (hasValue) {
      records.push(record);
    }
  }

  if (records.length === 0) {
    warnings.push(`No data found in ${sheetName}`);
  }

  return { records, errors, warnings };
}

function validateDomainConfig(config: DomainConfigExport): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.metadata) {
    errors.push('Missing metadata');
  } else {
    if (config.metadata.configType !== CONFIG_TYPE) {
      errors.push(`Invalid config type: ${config.metadata.configType}`);
    }
    if (config.metadata.schemaVersion !== SCHEMA_VERSION) {
      warnings.push(`Schema version mismatch: ${config.metadata.schemaVersion}`);
    }
    if (config.metadata.templateVersion && config.metadata.templateVersion !== TEMPLATE_VERSION) {
      warnings.push(`Template version mismatch: ${config.metadata.templateVersion}`);
    }
  }

  if (!config.securityDomain) {
    errors.push('Missing security domain');
  } else {
    if (!config.securityDomain.domainId || !config.securityDomain.domainName || !config.securityDomain.shortName) {
      errors.push('Security domain missing required fields');
    }
  }

  if (!config.taxonomy) {
    warnings.push('Missing taxonomy');
  }

  if (!Array.isArray(config.frameworks)) {
    config.frameworks = [];
    warnings.push('No frameworks found');
  }

  if (!Array.isArray(config.questions)) {
    config.questions = [];
    warnings.push('No questions found');
  }

  return { errors, warnings };
}

async function parseDomainConfigFromJson(file: File): Promise<{
  config: DomainConfigExport | null;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await file.text();
    const config = JSON.parse(content) as DomainConfigExport;
    const validation = validateDomainConfig(config);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
    return {
      config: validation.errors.length === 0 ? config : null,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      config: null,
      errors: ['Failed to parse JSON: ' + (err as Error).message],
      warnings,
    };
  }
}

async function parseDomainConfigFromXlsx(file: File): Promise<{
  config: DomainConfigExport | null;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const workbook = await readWorkbookFromFile(file);

    const metadataResult = readSheetRecords(
      workbook.getWorksheet('Metadata'),
      'Metadata',
      ['schemaVersion', 'configType', 'exportedAt', 'sourceDomainId', 'sourceDomainName'],
      XLSX_SHEET_LIMITS.metadata
    );
    const securityResult = readSheetRecords(
      workbook.getWorksheet('SecurityDomain'),
      'SecurityDomain',
      ['domainId', 'domainName', 'shortName'],
      XLSX_SHEET_LIMITS.securityDomain
    );
    const taxonomyResult = readSheetRecords(
      workbook.getWorksheet('TaxonomyDomains'),
      'TaxonomyDomains',
      ['domainId', 'domainName'],
      XLSX_SHEET_LIMITS.taxonomyDomains
    );
    const subcategoryResult = readSheetRecords(
      workbook.getWorksheet('Subcategories'),
      'Subcategories',
      ['subcatId', 'subcatName', 'domainId'],
      XLSX_SHEET_LIMITS.subcategories
    );
    const frameworkResult = readSheetRecords(
      workbook.getWorksheet('Frameworks'),
      'Frameworks',
      ['frameworkId', 'frameworkName', 'shortName'],
      XLSX_SHEET_LIMITS.frameworks
    );
    const questionResult = readSheetRecords(
      workbook.getWorksheet('Questions'),
      'Questions',
      ['questionId', 'questionText', 'domainId'],
      XLSX_SHEET_LIMITS.questions
    );

    errors.push(
      ...metadataResult.errors,
      ...securityResult.errors,
      ...taxonomyResult.errors,
      ...subcategoryResult.errors,
      ...frameworkResult.errors,
      ...questionResult.errors
    );
    warnings.push(
      ...metadataResult.warnings,
      ...securityResult.warnings,
      ...taxonomyResult.warnings,
      ...subcategoryResult.warnings,
      ...frameworkResult.warnings,
      ...questionResult.warnings
    );

    const securityRow = securityResult.records[0];
    if (!securityRow) {
      errors.push('SecurityDomain sheet is required');
      return { config: null, errors, warnings };
    }

    const securityDomain: SecurityDomainConfig = {
      domainId: securityRow.domainId || '',
      domainName: securityRow.domainName || '',
      shortName: securityRow.shortName || '',
      description: securityRow.description || '',
      color: securityRow.color || 'blue',
      icon: securityRow.icon || 'shield',
      displayOrder: parseNumber(securityRow.displayOrder || '') || 1,
    };

    const metadataRow = metadataResult.records[0];
    if (!metadataRow) {
      warnings.push('Metadata sheet missing; defaults applied');
    }

    const metadata: DomainConfigMetadata = {
      schemaVersion: metadataRow?.schemaVersion || SCHEMA_VERSION,
      templateVersion: metadataRow?.templateVersion || undefined,
      configType: metadataRow?.configType || CONFIG_TYPE,
      exportedAt: metadataRow?.exportedAt || new Date().toISOString(),
      sourceDomainId: metadataRow?.sourceDomainId || securityDomain.domainId,
      sourceDomainName: metadataRow?.sourceDomainName || securityDomain.domainName,
    };

    const taxonomyDomains: TaxonomyDomainConfig[] = [];
    taxonomyResult.records.forEach((row) => {
      if (!row.domainId || !row.domainName) {
        warnings.push('Skipping taxonomy domain with missing fields');
        return;
      }
      taxonomyDomains.push({
        domainId: row.domainId,
        domainName: row.domainName,
        description: row.description || null,
        displayOrder: parseNumber(row.displayOrder || ''),
        nistAiRmfFunction: row.nistAiRmfFunction || null,
        bankingRelevance: row.bankingRelevance || null,
        strategicQuestion: row.strategicQuestion || null,
      });
    });

    const subcategories: TaxonomySubcategoryConfig[] = [];
    subcategoryResult.records.forEach((row) => {
      if (!row.subcatId || !row.subcatName || !row.domainId) {
        warnings.push('Skipping subcategory with missing fields');
        return;
      }
      subcategories.push({
        subcatId: row.subcatId,
        subcatName: row.subcatName,
        domainId: row.domainId,
        definition: row.definition || null,
        objective: row.objective || null,
        criticality: row.criticality || null,
        ownershipType: row.ownershipType || null,
        riskSummary: row.riskSummary || null,
        securityOutcome: row.securityOutcome || null,
        weight: parseNumber(row.weight || ''),
        frameworkRefs: parseList(row.frameworkRefs || ''),
      });
    });

    const frameworks: FrameworkConfig[] = [];
    frameworkResult.records.forEach((row) => {
      if (!row.frameworkId || !row.frameworkName || !row.shortName) {
        warnings.push('Skipping framework with missing fields');
        return;
      }
      frameworks.push({
        frameworkId: row.frameworkId,
        frameworkName: row.frameworkName,
        shortName: row.shortName,
        version: row.version || null,
        description: row.description || null,
        category: row.category || null,
        targetAudience: parseList(row.targetAudience || ''),
        assessmentScope: row.assessmentScope || null,
        referenceLinks: parseList(row.referenceLinks || ''),
        defaultEnabled: parseBoolean(row.defaultEnabled || ''),
      });
    });

    const questions: QuestionConfig[] = [];
    questionResult.records.forEach((row) => {
      if (!row.questionId || !row.questionText || !row.domainId) {
        warnings.push('Skipping question with missing fields');
        return;
      }
      questions.push({
        questionId: row.questionId,
        questionText: row.questionText,
        domainId: row.domainId,
        subcatId: row.subcatId || null,
        criticality: row.criticality || null,
        ownershipType: row.ownershipType || null,
        riskSummary: row.riskSummary || null,
        expectedEvidence: row.expectedEvidence || null,
        imperativeChecks: row.imperativeChecks || null,
        frameworks: parseList(row.frameworks || ''),
      });
    });

    const config: DomainConfigExport = {
      metadata,
      securityDomain,
      taxonomy: {
        domains: taxonomyDomains,
        subcategories,
      },
      frameworks,
      questions,
    };

    const validation = validateDomainConfig(config);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    return {
      config: validation.errors.length === 0 ? config : null,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      config: null,
      errors: ['Failed to read XLSX: ' + (err as Error).message],
      warnings,
    };
  }
}

/**
 * Validate an import file
 */
export async function validateImportFile(file: File): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!file) {
    return {
      isValid: false,
      errors: ['No file selected'],
      warnings: [],
      config: null,
    };
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    errors.push(`File too large. Max ${(MAX_IMPORT_FILE_BYTES / (1024 * 1024)).toFixed(1)}MB`);
  }

  const extension = getFileExtension(file.name);
  if (!ALLOWED_IMPORT_EXTENSIONS.includes(extension)) {
    errors.push('Unsupported file type. Use .json or .xlsx');
  }

    if (extension === '.xlsx' && file.type && file.type !== XLSX_MIME_TYPE) {
    warnings.push('Unexpected MIME type for XLSX file');
  }

  if (extension === '.json' && file.type && file.type !== JSON_MIME_TYPE) {
    warnings.push('Unexpected MIME type for JSON file');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      config: null,
    };
  }

  if (extension === '.xlsx') {
    const scan = await scanXlsxFile(file);
    warnings.push(...scan.warnings);
    if (scan.errors.length > 0) {
      return {
        isValid: false,
        errors: scan.errors,
        warnings,
        config: null,
      };
    }
  }

  const result = extension === '.xlsx'
    ? await parseDomainConfigFromXlsx(file)
    : await parseDomainConfigFromJson(file);

  warnings.push(...result.warnings);

  let preview: DomainImportPreview | null = null;
  if (result.config && result.errors.length === 0) {
    preview = buildDomainImportPreview(result.config);
    warnings.push(...preview.warnings);
  }

  const uniqueWarnings = Array.from(new Set(warnings));

  return {
    isValid: result.errors.length === 0,
    errors: result.errors,
    warnings: uniqueWarnings,
    config: result.errors.length === 0 ? result.config : null,
    preview,
  };
}
/**
 * Generate a unique domain ID for import
 */
function generateUniqueDomainId(baseName: string, existingIds: string[]): string {
  const baseId = baseName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
  let uniqueId = baseId;
  let counter = 1;

  while (existingIds.includes(uniqueId)) {
    uniqueId = `${baseId}_${counter}`;
    counter++;
  }

  return uniqueId;
}

/**
 * Import a domain configuration
 */
export async function importDomainConfig(
  config: DomainConfigExport,
  options: {
    newDomainId?: string;
    newDomainName?: string;
    importFrameworks?: boolean;
    importQuestions?: boolean;
  } = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    domainId: null,
    warnings: [],
    errors: [],
    stats: {
      taxonomyDomains: 0,
      subcategories: 0,
      frameworks: 0,
      questions: 0
    }
  };

  try {
    // Get existing security domains
    const { data: existingDomains } = await supabase
      .from('security_domains')
      .select('domain_id');

    const existingIds = (existingDomains || []).map(d => d.domain_id);

    // Generate new domain ID if not provided
    const newDomainId = options.newDomainId || 
      generateUniqueDomainId(config.securityDomain.shortName, existingIds);

    const newDomainName = options.newDomainName || config.securityDomain.domainName;

    // Check if domain ID already exists
    if (existingIds.includes(newDomainId)) {
      result.errors.push(`Domínio com ID "${newDomainId}" já existe`);
      return result;
    }

    // Create ID mappings for taxonomy
    const domainIdMap: Record<string, string> = {};
    const subcatIdMap: Record<string, string> = {};

    // Create security domain
    const { error: secDomainError } = await supabase
      .from('security_domains')
      .insert({
        domain_id: newDomainId,
        domain_name: newDomainName,
        short_name: options.newDomainId ? options.newDomainId.replace(/_/g, ' ') : config.securityDomain.shortName,
        description: config.securityDomain.description,
        color: config.securityDomain.color,
        icon: config.securityDomain.icon,
        display_order: config.securityDomain.displayOrder,
        is_enabled: true
      });

    if (secDomainError) {
      result.errors.push(`Erro ao criar domínio de segurança: ${secDomainError.message}`);
      return result;
    }

    result.domainId = newDomainId;

    // Import taxonomy domains
    for (const taxDomain of config.taxonomy?.domains || []) {
      const newTaxDomainId = `${newDomainId}_${taxDomain.domainId.split('_').pop() || Date.now()}`;
      domainIdMap[taxDomain.domainId] = newTaxDomainId;

      const { error: taxError } = await supabase
        .from('domains')
        .insert({
          domain_id: newTaxDomainId,
          domain_name: taxDomain.domainName,
          description: taxDomain.description,
          display_order: taxDomain.displayOrder,
          nist_ai_rmf_function: taxDomain.nistAiRmfFunction,
          banking_relevance: taxDomain.bankingRelevance,
          strategic_question: taxDomain.strategicQuestion,
          security_domain_id: newDomainId
        });

      if (taxError) {
        result.warnings.push(`Aviso ao criar domínio de taxonomia "${taxDomain.domainName}": ${taxError.message}`);
      } else {
        result.stats.taxonomyDomains++;
      }
    }

    // Import subcategories
    for (const subcat of config.taxonomy?.subcategories || []) {
      const mappedDomainId = domainIdMap[subcat.domainId] || subcat.domainId;
      const newSubcatId = `${newDomainId}_${subcat.subcatId.split('_').pop() || Date.now()}`;
      subcatIdMap[subcat.subcatId] = newSubcatId;

      const { error: subcatError } = await supabase
        .from('subcategories')
        .insert({
          subcat_id: newSubcatId,
          subcat_name: subcat.subcatName,
          domain_id: mappedDomainId,
          definition: subcat.definition,
          objective: subcat.objective,
          criticality: subcat.criticality,
          ownership_type: subcat.ownershipType,
          risk_summary: subcat.riskSummary,
          security_outcome: subcat.securityOutcome,
          weight: subcat.weight,
          framework_refs: subcat.frameworkRefs,
          security_domain_id: newDomainId
        });

      if (subcatError) {
        result.warnings.push(`Aviso ao criar subcategoria "${subcat.subcatName}": ${subcatError.message}`);
      } else {
        result.stats.subcategories++;
      }
    }

    // Import frameworks (if enabled)
    if (options.importFrameworks !== false) {
      for (const fw of config.frameworks || []) {
        const newFwId = `${newDomainId}_${fw.frameworkId.split('_').pop() || Date.now()}`;

        const { error: fwError } = await supabase
          .from('custom_frameworks')
          .insert({
            framework_id: newFwId,
            framework_name: fw.frameworkName,
            short_name: fw.shortName,
            version: fw.version,
            description: fw.description,
            category: fw.category,
            target_audience: fw.targetAudience,
            assessment_scope: fw.assessmentScope,
            reference_links: fw.referenceLinks,
            default_enabled: fw.defaultEnabled,
            security_domain_id: newDomainId
          });

        if (fwError) {
          result.warnings.push(`Aviso ao criar framework "${fw.frameworkName}": ${fwError.message}`);
        } else {
          result.stats.frameworks++;
        }
      }
    }

    // Import questions (if enabled)
    if (options.importQuestions !== false) {
      for (const q of config.questions || []) {
        const mappedDomainId = domainIdMap[q.domainId] || q.domainId;
        const mappedSubcatId = q.subcatId ? (subcatIdMap[q.subcatId] || q.subcatId) : null;
        const newQId = `${newDomainId}_${q.questionId.split('_').pop() || Date.now()}`;

        const { error: qError } = await supabase
          .from('custom_questions')
          .insert({
            question_id: newQId,
            question_text: q.questionText,
            domain_id: mappedDomainId,
            subcat_id: mappedSubcatId,
            criticality: q.criticality,
            ownership_type: q.ownershipType,
            risk_summary: q.riskSummary,
            expected_evidence: q.expectedEvidence,
            imperative_checks: q.imperativeChecks,
            frameworks: q.frameworks,
            security_domain_id: newDomainId
          });

        if (qError) {
          result.warnings.push(`Aviso ao criar pergunta: ${qError.message}`);
        } else {
          result.stats.questions++;
        }
      }
    }

    result.success = true;

    try {
      await logAuditEvent({
        entityType: 'catalog',
        entityId: result.domainId || newDomainId,
        action: 'create',
        changes: {
          domainId: result.domainId || newDomainId,
          taxonomyDomains: result.stats.taxonomyDomains,
          subcategories: result.stats.subcategories,
          frameworks: result.stats.frameworks,
          questions: result.stats.questions,
        },
      });
    } catch (error) {
      console.warn('Failed to log catalog import:', error);
    }

    return result;
  } catch (error) {
    result.errors.push(`Erro durante importação: ${(error as Error).message}`);
    return result;
  }
}
