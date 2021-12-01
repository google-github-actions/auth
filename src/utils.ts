'use strict';

import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

/**
 * writeSecureFile writes a file to disk in a given directory with a
 * random name.
 *
 * @param outputDir Directory to create random file in.
 * @param data Data to write to file.
 * @returns Path to written file.
 */
export async function writeSecureFile(outputDir: string, data: string): Promise<string> {
  // Generate a random filename to store the credential. 12 bytes is 24
  // characters in hex. It's not the ideal entropy, but we have to be under
  // the 255 character limit for Windows filenames (which includes their
  // entire leading path).
  const uniqueName = crypto.randomBytes(12).toString('hex');
  const pth = path.join(outputDir, uniqueName);

  // Write the file as 0640 so the owner has RW, group as R, and the file is
  // otherwise unreadable. Also write with EXCL to prevent a symlink attack.
  await fs.writeFile(pth, data, { mode: 0o640, flag: 'wx' });

  return pth;
}

/**
 * removeExportedCredentials removes any exported credentials file. If the file
 * does not exist, it does nothing.
 *
 * @returns Path of the file that was removed.
 */
export async function removeExportedCredentials(): Promise<string> {
  // Look up the credentials path, if one exists. Note that we only check the
  // environment variable set by our action, since we don't want to
  // accidentially clean up if someone set GOOGLE_APPLICATION_CREDENTIALS or
  // another environment variable manually.
  const credentialsPath = process.env['GOOGLE_GHA_CREDS_PATH'];
  if (!credentialsPath) {
    return '';
  }

  // Delete the file.
  try {
    await fs.unlink(credentialsPath);
    return credentialsPath;
  } catch (err) {
    if (err instanceof Error)
      if (err && err.message && err.message.includes('ENOENT')) {
        return '';
      }

    throw new Error(`failed to remove exported credentials: ${err}`);
  }
}

/**
 * Converts a multi-line or comma-separated collection of strings into an array
 * of trimmed strings.
 */
export function explodeStrings(input: string): Array<string> {
  if (!input || input.trim().length === 0) {
    return [];
  }

  const list = new Array<string>();
  let curr = '';
  let escaped = false;
  for (const ch of input) {
    if (escaped) {
      curr += ch;
      escaped = false;
      continue;
    }

    switch (ch) {
      case '\\':
        escaped = true;
        continue;
      case ',':
      case '\n': {
        const val = curr.trim();
        if (val) {
          list.push(val);
        }
        curr = '';
        break;
      }
      default:
        curr += ch;
    }
  }

  const val = curr.trim();
  if (val) {
    list.push(val);
  }

  return list;
}

/**
 * toBase64 base64 URL encodes the result.
 */
export function toBase64(s: string | Buffer): string {
  return Buffer.from(s)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * fromBase64 base64 decodes the result, taking into account URL and standard
 * encoding with and without padding.
 */
export function fromBase64(s: string): string {
  const str = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * trimmedString returns a string trimmed of whitespace. If the input string is
 * null, then it returns the empty string.
 */
export function trimmedString(s: string | undefined | null): string {
  return s ? s.trim() : '';
}

/**
 * parseDuration parses a user-supplied string duration with optional suffix and
 * returns a number representing the number of seconds. It returns 0 when given
 * the empty string.
 *
 * @param str Duration string
 */
export function parseDuration(str: string): number {
  const given = (str || '').trim();
  if (!given) {
    return 0;
  }

  let total = 0;
  let curr = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    switch (ch) {
      case ' ':
        continue;
      case ',':
        continue;
      case 's': {
        total += +curr;
        curr = '';
        break;
      }
      case 'm': {
        total += +curr * 60;
        curr = '';
        break;
      }
      case 'h': {
        total += +curr * 60 * 60;
        curr = '';
        break;
      }

      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        curr += ch;
        break;
      default:
        throw new SyntaxError(`Unsupported character "${ch}" at position ${i}`);
    }
  }

  // Anything left over is seconds
  if (curr) {
    total += +curr;
  }

  return total;
}
