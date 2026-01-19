import { describe, expect, it } from 'vitest';
import { scanXlsxFile } from '@/lib/xlsxSecurity';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function buildFile(payload: string): File {
  const bytes = new TextEncoder().encode(payload);
  return {
    name: 'import.xlsx',
    type: XLSX_MIME_TYPE,
    size: bytes.length,
    arrayBuffer: async () => bytes,
  } as File;
}

describe('xlsxSecurity', () => {
  it('flags macro indicators', async () => {
    const file = buildFile('random-content vbaProject.bin more');
    const result = await scanXlsxFile(file);
    expect(result.errors.join(' ')).toContain('macros');
  });

  it('accepts a clean payload', async () => {
    const file = buildFile('clean payload');
    const result = await scanXlsxFile(file);
    expect(result.errors).toHaveLength(0);
  });
});
