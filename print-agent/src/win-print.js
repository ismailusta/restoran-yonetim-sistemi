import { execFile } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(__dirname, '..', 'scripts', 'win-raw-print.ps1');

export async function isPrinterAvailable(printerName) {
  if (process.platform !== 'win32') return false;

  try {
    const { stdout } = await execFileAsync('powershell', [
      '-NoProfile',
      '-Command',
      `[bool](Get-Printer -Name '${printerName.replace(/'/g, "''")}' -ErrorAction SilentlyContinue)`,
    ]);
    return stdout.trim().toLowerCase() === 'true';
  } catch {
    return false;
  }
}

export async function sendToWindowsPrinter(printerName, buffer) {
  if (process.platform !== 'win32') {
    throw new Error('RAW yazdırma sadece Windows destekleniyor');
  }

  const tmpPath = join(tmpdir(), `receipt-${Date.now()}.bin`);
  writeFileSync(tmpPath, buffer);

  try {
    await execFileAsync('powershell', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      SCRIPT_PATH,
      '-PrinterName',
      printerName,
      '-FilePath',
      tmpPath,
    ]);
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}
