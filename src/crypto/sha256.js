// ============================================
// KONOMI KONCEPTION - SHA256 Implementation
// Pure JavaScript - Zero Dependencies
// ============================================

const KonomiSHA256 = {
  // SHA256 constants
  K: [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ],

  // Initial hash values
  H0: [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19],

  // Right rotate
  rotr(n, x) {
    return ((x >>> n) | (x << (32 - n))) >>> 0;
  },

  // SHA256 functions
  ch(x, y, z) {
    return ((x & y) ^ (~x & z)) >>> 0;
  },

  maj(x, y, z) {
    return ((x & y) ^ (x & z) ^ (y & z)) >>> 0;
  },

  sigma0(x) {
    return (this.rotr(2, x) ^ this.rotr(13, x) ^ this.rotr(22, x)) >>> 0;
  },

  sigma1(x) {
    return (this.rotr(6, x) ^ this.rotr(11, x) ^ this.rotr(25, x)) >>> 0;
  },

  gamma0(x) {
    return (this.rotr(7, x) ^ this.rotr(18, x) ^ (x >>> 3)) >>> 0;
  },

  gamma1(x) {
    return (this.rotr(17, x) ^ this.rotr(19, x) ^ (x >>> 10)) >>> 0;
  },

  // Pad message
  pad(bytes) {
    const len = bytes.length;
    const bitLen = len * 8;

    // Calculate padding
    let padLen = 64 - ((len + 9) % 64);
    if (padLen === 64) padLen = 0;

    const padded = new Uint8Array(len + 1 + padLen + 8);
    padded.set(bytes);
    padded[len] = 0x80;

    // Append bit length as 64-bit big-endian
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 4, bitLen >>> 0, false);

    return padded;
  },

  // Process a 512-bit block
  processBlock(H, block) {
    const W = new Uint32Array(64);
    const view = new DataView(block.buffer, block.byteOffset);

    // Copy block into first 16 words
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(i * 4, false);
    }

    // Extend to 64 words
    for (let i = 16; i < 64; i++) {
      W[i] = (this.gamma1(W[i - 2]) + W[i - 7] + this.gamma0(W[i - 15]) + W[i - 16]) >>> 0;
    }

    // Initialize working variables
    let [a, b, c, d, e, f, g, h] = H;

    // Main loop
    for (let i = 0; i < 64; i++) {
      const T1 = (h + this.sigma1(e) + this.ch(e, f, g) + this.K[i] + W[i]) >>> 0;
      const T2 = (this.sigma0(a) + this.maj(a, b, c)) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    // Update hash
    return [
      (H[0] + a) >>> 0,
      (H[1] + b) >>> 0,
      (H[2] + c) >>> 0,
      (H[3] + d) >>> 0,
      (H[4] + e) >>> 0,
      (H[5] + f) >>> 0,
      (H[6] + g) >>> 0,
      (H[7] + h) >>> 0
    ];
  },

  // Hash bytes
  hashBytes(bytes) {
    const padded = this.pad(bytes);
    let H = [...this.H0];

    // Process each 512-bit block
    for (let i = 0; i < padded.length; i += 64) {
      H = this.processBlock(H, padded.subarray(i, i + 64));
    }

    // Convert to bytes
    const result = new Uint8Array(32);
    const view = new DataView(result.buffer);
    for (let i = 0; i < 8; i++) {
      view.setUint32(i * 4, H[i], false);
    }

    return result;
  },

  // Hash string (returns hex)
  hash(str) {
    const bytes = KonomiUtils.utf8Encode(str);
    const hash = this.hashBytes(bytes);
    return KonomiUtils.hexEncode(hash);
  },

  // HMAC-SHA256
  hmac(key, message) {
    // Convert to bytes if string
    let keyBytes = typeof key === 'string' ? KonomiUtils.utf8Encode(key) : key;
    const msgBytes = typeof message === 'string' ? KonomiUtils.utf8Encode(message) : message;

    // If key > 64 bytes, hash it
    if (keyBytes.length > 64) {
      keyBytes = this.hashBytes(keyBytes);
    }

    // Pad key to 64 bytes
    const paddedKey = new Uint8Array(64);
    paddedKey.set(keyBytes);

    // Create inner and outer padded keys
    const ipad = new Uint8Array(64);
    const opad = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      ipad[i] = paddedKey[i] ^ 0x36;
      opad[i] = paddedKey[i] ^ 0x5c;
    }

    // Inner hash
    const inner = new Uint8Array(64 + msgBytes.length);
    inner.set(ipad);
    inner.set(msgBytes, 64);
    const innerHash = this.hashBytes(inner);

    // Outer hash
    const outer = new Uint8Array(64 + 32);
    outer.set(opad);
    outer.set(innerHash, 64);

    return this.hashBytes(outer);
  }
};
