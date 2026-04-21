import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { MaskifyStream } from '../src/stream';

// MaskifyStream expects whole JSON lines (or full objects in object mode),
// not arbitrary buffer chunks. For line-oriented log files, split on newlines
// with readline first so each push() is a complete record.
const rl = createInterface({
  input: createReadStream('input.log', { encoding: 'utf8' }),
  crlfDelay: Infinity,
});

Readable.from(rl)
  .pipe(new MaskifyStream())
  .pipe(createWriteStream('masked.log'));
