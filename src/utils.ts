import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

/**
 * writeCredFile writes a file to disk in a given directory with a
 * random name.
 *
 * @param outputDir Directory to create random file in.
 * @param data Data to write to file.
 * @returns Path to written file.
 */
export async function writeCredFile(outputDir: string, data: string): Promise<string> {
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
 * Converts a multi-line or comma-separated collection of strings into an array
 * of trimmed strings.
 */
export function explodeStrings(input: string): Array<string> {
  if (input == null || input.length === 0) {
    return [];
  }

  const list = new Array<string>();
  for (const line of input.split(`\n`)) {
    for (const piece of line.split(',')) {
      const entry = piece.trim();
      if (entry !== '') {
        list.push(entry);
      }
    }
  }
  return list;
}
