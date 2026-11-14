const SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const CONSTANTS = Array.from(
  { length: 64 },
  (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0
);

const BLOCK = 64;

export function createMd5() {
  let a0 = 0x67452301;
  let b0 = 0xefcdab89 | 0;
  let c0 = 0x98badcfe | 0;
  let d0 = 0x10325476;
  let total = 0;
  let pendingLength = 0;
  let finished = null;
  const pending = new Uint8Array(BLOCK);
  const pendingView = new DataView(pending.buffer);
  const words = new Int32Array(16);

  const compress = (view, offset) => {
    for (let i = 0; i < 16; i++) words[i] = view.getInt32(offset + i * 4, true);
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f;
      let g;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const sum = (a + f + CONSTANTS[i] + words[g]) | 0;
      const shift = SHIFTS[i];
      a = d;
      d = c;
      c = b;
      b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
    }
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  };

  const update = (bytes) => {
    if (finished) throw new Error('MD5 digest already produced');
    let offset = 0;
    total += bytes.length;
    if (pendingLength > 0) {
      const take = Math.min(BLOCK - pendingLength, bytes.length);
      pending.set(bytes.subarray(0, take), pendingLength);
      pendingLength += take;
      offset = take;
      if (pendingLength < BLOCK) return api;
      compress(pendingView, 0);
      pendingLength = 0;
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (; offset + BLOCK <= bytes.length; offset += BLOCK) compress(view, offset);
    if (offset < bytes.length) {
      pending.set(bytes.subarray(offset), 0);
      pendingLength = bytes.length - offset;
    }
    return api;
  };

  const digest = () => {
    if (finished) return finished.slice();
    const bits = total * 8;
    const padLength = pendingLength < 56 ? 56 - pendingLength : 120 - pendingLength;
    const tail = new Uint8Array(padLength + 8);
    tail[0] = 0x80;
    const tailView = new DataView(tail.buffer);
    tailView.setUint32(padLength, bits % 4294967296, true);
    tailView.setUint32(padLength + 4, Math.floor(bits / 4294967296), true);
    update(tail);
    const out = new Uint8Array(16);
    const outView = new DataView(out.buffer);
    outView.setInt32(0, a0, true);
    outView.setInt32(4, b0, true);
    outView.setInt32(8, c0, true);
    outView.setInt32(12, d0, true);
    finished = out;
    return out.slice();
  };

  const api = { update, digest };
  return api;
}

export function md5(bytes) {
  return createMd5().update(bytes).digest();
}

export function createHmacMd5(keyBytes) {
  const key = new Uint8Array(BLOCK);
  key.set(keyBytes.length > BLOCK ? md5(keyBytes) : keyBytes);
  const inner = createMd5().update(key.map((byte) => byte ^ 0x36));
  const api = {
    update(bytes) {
      inner.update(bytes);
      return api;
    },
    digest() {
      return createMd5()
        .update(key.map((byte) => byte ^ 0x5c))
        .update(inner.digest())
        .digest();
    },
  };
  return api;
}
