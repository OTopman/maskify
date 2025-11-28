import { Readable } from 'stream';
import { MaskifyStream } from '../src/stream'; // Ensure you export this from index if needed, or import from path

describe('Maskify Stream', () => {
  it('should mask data flowing through the stream', (done) => {
    const maskStream = new MaskifyStream({ email: { type: 'email' } });

    const input = [
      { email: 'a@b.com', id: 1 },
      { email: 'c@d.com', id: 2 },
    ];

    const results: any[] = [];

    // Create a readable source
    const source = new Readable({ objectMode: true });
    input.forEach((item) => source.push(item));
    source.push(null); // End of stream

    source
      .pipe(maskStream)
      .on('data', (chunk) => results.push(chunk))
      .on('end', () => {
        expect(results).toHaveLength(2);
        expect(results[0].email).not.toBe('a@b.com');
        expect(results[0].id).toBe(1);
        done();
      });
  });

  it('should handle JSON strings in stream (Buffer mode)', (done) => {
    const maskStream = new MaskifyStream({ secret: { type: 'generic' } });

    const results: string[] = [];
    const source = new Readable();
    source.push(JSON.stringify({ secret: 'password' }));
    source.push(null);

    source
      .pipe(maskStream)
      .on('data', (chunk) => results.push(chunk.toString()))
      .on('end', () => {
        const parsed = JSON.parse(results[0]);
        expect(parsed.secret).not.toBe('password');
        done();
      });
  });
});
