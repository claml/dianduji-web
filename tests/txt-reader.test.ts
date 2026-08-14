import { describe, expect, it } from 'vitest';
import { decodeText } from '../src/txt-reader';

function bytesOf(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

describe('decodeText', () => {
  it('decodes UTF-8', () => {
    const out = decodeText(bytesOf('Hello 世界'));
    expect(out).toBe('Hello 世界');
  });

  it('falls back to GB18030 for legacy encoded text', () => {
    // '点读机' encoded as GB18030 bytes.
    const gbBytes = new Uint8Array([0xB5, 0xE3, 0xB6, 0xC1, 0xBB, 0xFA]);
    const out = decodeText(gbBytes.buffer);
    expect(out).toBe('点读机');
  });

  it('never throws on arbitrary bytes', () => {
    const junk = new Uint8Array([0xff, 0xfe, 0x80, 0x81, 0x00, 0x41]);
    const out = decodeText(junk.buffer);
    expect(typeof out).toBe('string');
  });
});
