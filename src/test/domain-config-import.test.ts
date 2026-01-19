import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { validateImportFile } from '@/lib/domainConfigExport';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function buildDomainConfigFile(options?: { withFormula?: boolean; duplicateTaxonomyDomain?: boolean }): Promise<File> {
  const workbook = new ExcelJS.Workbook();

  const metadataSheet = workbook.addWorksheet('Metadata');
  metadataSheet.columns = [
    { header: 'schemaVersion', key: 'schemaVersion' },
    { header: 'configType', key: 'configType' },
    { header: 'exportedAt', key: 'exportedAt' },
    { header: 'sourceDomainId', key: 'sourceDomainId' },
    { header: 'sourceDomainName', key: 'sourceDomainName' },
  ];
  metadataSheet.addRow({
    schemaVersion: '1.0.0',
    configType: 'SECURITY_DOMAIN_CONFIG',
    exportedAt: new Date().toISOString(),
    sourceDomainId: 'TEST_DOMAIN',
    sourceDomainName: 'Test Domain',
  });

  const securitySheet = workbook.addWorksheet('SecurityDomain');
  securitySheet.columns = [
    { header: 'domainId', key: 'domainId' },
    { header: 'domainName', key: 'domainName' },
    { header: 'shortName', key: 'shortName' },
  ];
  securitySheet.addRow({
    domainId: 'TEST_DOMAIN',
    domainName: 'Test Domain',
    shortName: 'Test',
  });
  if (options?.withFormula) {
    securitySheet.getCell('A2').value = { formula: 'SUM(1,1)', result: 2 };
  }

  const taxonomySheet = workbook.addWorksheet('TaxonomyDomains');
  taxonomySheet.columns = [
    { header: 'domainId', key: 'domainId' },
    { header: 'domainName', key: 'domainName' },
  ];
  taxonomySheet.addRow({ domainId: 'TEST_DOMAIN_GOV', domainName: 'Governance' });
  if (options?.duplicateTaxonomyDomain) {
    taxonomySheet.addRow({ domainId: 'TEST_DOMAIN_GOV', domainName: 'Governance Copy' });
  }

  const subcatSheet = workbook.addWorksheet('Subcategories');
  subcatSheet.columns = [
    { header: 'subcatId', key: 'subcatId' },
    { header: 'subcatName', key: 'subcatName' },
    { header: 'domainId', key: 'domainId' },
  ];
  subcatSheet.addRow({ subcatId: 'TEST_SUB_001', subcatName: 'Policies', domainId: 'TEST_DOMAIN_GOV' });

  const frameworksSheet = workbook.addWorksheet('Frameworks');
  frameworksSheet.columns = [
    { header: 'frameworkId', key: 'frameworkId' },
    { header: 'frameworkName', key: 'frameworkName' },
    { header: 'shortName', key: 'shortName' },
  ];
  frameworksSheet.addRow({ frameworkId: 'TEST_FW', frameworkName: 'Test Framework', shortName: 'TEST' });

  const questionsSheet = workbook.addWorksheet('Questions');
  questionsSheet.columns = [
    { header: 'questionId', key: 'questionId' },
    { header: 'questionText', key: 'questionText' },
    { header: 'domainId', key: 'domainId' },
  ];
  questionsSheet.addRow({ questionId: 'TEST_Q_001', questionText: 'Test question?', domainId: 'TEST_DOMAIN_GOV' });

  const buffer = await workbook.xlsx.writeBuffer();
  const payload = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  return {
    name: 'domain-config.xlsx',
    size: payload.byteLength || payload.length,
    type: XLSX_MIME_TYPE,
    arrayBuffer: async () => payload,
  } as File;
}

describe('domain config import', () => {
  it('validates a well-formed XLSX template', async () => {
    const file = await buildDomainConfigFile();
    const result = await validateImportFile(file);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.config).not.toBeNull();
  });

  it('rejects XLSX files with formulas', async () => {
    const file = await buildDomainConfigFile({ withFormula: true });
    const result = await validateImportFile(file);
    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toContain('Formula not allowed');
  });

  it('adds preview warnings for duplicate taxonomy domains', async () => {
    const file = await buildDomainConfigFile({ duplicateTaxonomyDomain: true });
    const result = await validateImportFile(file);
    expect(result.isValid).toBe(true);
    expect(result.preview).not.toBeNull();
    expect(result.warnings.join(' ')).toContain('Duplicate taxonomy domain IDs');
  });
});
