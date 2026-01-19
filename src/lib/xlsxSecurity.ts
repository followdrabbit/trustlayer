const MACRO_INDICATORS = [
  'vbaProject.bin',
  'xl/vbaProject.bin',
  'xl/activeX',
  'xl/embeddings',
  'xl/macrosheets',
  'xl/dialogs',
];

const DEFAULT_SCAN_TIMEOUT_MS = 15000;

export interface XlsxScanResult {
  errors: string[];
  warnings: string[];
  bytes: Uint8Array;
  scanned: boolean;
}

type ScanVerdict = 'clean' | 'infected' | 'unknown';

async function readFileBytes(file: File): Promise<Uint8Array> {
  const rawData = typeof file.arrayBuffer === 'function'
    ? await file.arrayBuffer()
    : await new Response(file).arrayBuffer();
  return rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData as ArrayBuffer);
}

function detectMacroIndicators(payload: Uint8Array): string[] {
  const decoder = new TextDecoder('latin1');
  const text = decoder.decode(payload);
  return MACRO_INDICATORS.filter((marker) => text.includes(marker));
}

function parseScanResponse(payload: unknown): { verdict: ScanVerdict; message?: string } {
  if (!payload || typeof payload !== 'object') {
    return { verdict: 'unknown' };
  }

  const record = payload as Record<string, unknown>;
  const status = typeof record.status === 'string' ? record.status.toLowerCase() : '';
  const clean = typeof record.clean === 'boolean' ? record.clean : undefined;
  const infected = typeof record.infected === 'boolean' ? record.infected : undefined;
  const message = typeof record.message === 'string'
    ? record.message
    : typeof record.detail === 'string'
      ? record.detail
      : undefined;

  if (status === 'clean' || clean === true || infected === false) {
    return { verdict: 'clean', message };
  }
  if (status === 'infected' || clean === false || infected === true) {
    return { verdict: 'infected', message };
  }
  return { verdict: 'unknown', message };
}

async function runExternalScan(
  url: string,
  file: File,
  bytes: Uint8Array
): Promise<{ verdict: ScanVerdict; message?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_SCAN_TIMEOUT_MS);
  const payload = new FormData();
  payload.append(
    'file',
    new Blob([bytes], { type: file.type || 'application/octet-stream' }),
    file.name
  );

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: payload,
      signal: controller.signal,
    });

    if (!response.ok) {
      return { verdict: 'unknown', message: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return parseScanResponse(data);
    }

    const text = await response.text();
    return { verdict: 'unknown', message: text.slice(0, 200) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro na verificacao';
    return { verdict: 'unknown', message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanXlsxFile(file: File): Promise<XlsxScanResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const bytes = await readFileBytes(file);

  const indicators = detectMacroIndicators(bytes);
  if (indicators.length > 0) {
    errors.push('Arquivo XLSX contem macros ou objetos embutidos. Remova macros antes de importar.');
  }

  const scanUrl = import.meta.env.VITE_IMPORT_MALWARE_SCAN_URL;
  const scanRequired = import.meta.env.VITE_IMPORT_MALWARE_SCAN_REQUIRED === 'true';
  let scanned = false;

  if (scanUrl) {
    scanned = true;
    const result = await runExternalScan(scanUrl, file, bytes);
    if (result.verdict === 'infected') {
      errors.push(`Arquivo reprovado na verificacao antivirus${result.message ? `: ${result.message}` : ''}.`);
    } else if (result.verdict === 'unknown') {
      const message = `Verificacao antivirus indisponivel${result.message ? `: ${result.message}` : ''}.`;
      if (scanRequired) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  } else if (scanRequired) {
    errors.push('Verificacao antivirus requerida, mas VITE_IMPORT_MALWARE_SCAN_URL nao esta configurado.');
  }

  return { errors, warnings, bytes, scanned };
}
