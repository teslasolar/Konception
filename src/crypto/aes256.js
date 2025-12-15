// ============================================
// KONOMI KONCEPTION - AES256 Implementation
// Pure JavaScript - Zero Dependencies
// ============================================

const KonomiAES = {
  // S-box for SubBytes transformation
  SBOX: [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
  ],

  // Inverse S-box for InvSubBytes
  INV_SBOX: [
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
  ],

  // Round constants
  RCON: [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36],

  // Galois field multiplication
  gmul(a, b) {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) p ^= a;
      const hi = a & 0x80;
      a = (a << 1) & 0xFF;
      if (hi) a ^= 0x1b;
      b >>= 1;
    }
    return p;
  },

  // Key expansion for AES-256
  keyExpansion(key) {
    const Nk = 8; // 256 bit key = 8 words
    const Nr = 14; // 14 rounds for AES-256
    const Nb = 4;
    const W = new Uint32Array((Nr + 1) * Nb);

    // Copy key into first Nk words
    for (let i = 0; i < Nk; i++) {
      W[i] = (key[4 * i] << 24) | (key[4 * i + 1] << 16) | (key[4 * i + 2] << 8) | key[4 * i + 3];
    }

    // Generate remaining words
    for (let i = Nk; i < (Nr + 1) * Nb; i++) {
      let temp = W[i - 1];

      if (i % Nk === 0) {
        // RotWord + SubWord + Rcon
        temp = ((temp << 8) | (temp >>> 24)) >>> 0;
        temp = (this.SBOX[(temp >>> 24) & 0xFF] << 24) |
               (this.SBOX[(temp >>> 16) & 0xFF] << 16) |
               (this.SBOX[(temp >>> 8) & 0xFF] << 8) |
               this.SBOX[temp & 0xFF];
        temp ^= (this.RCON[(i / Nk) - 1] << 24);
      } else if (i % Nk === 4) {
        // SubWord only
        temp = (this.SBOX[(temp >>> 24) & 0xFF] << 24) |
               (this.SBOX[(temp >>> 16) & 0xFF] << 16) |
               (this.SBOX[(temp >>> 8) & 0xFF] << 8) |
               this.SBOX[temp & 0xFF];
      }

      W[i] = (W[i - Nk] ^ temp) >>> 0;
    }

    return W;
  },

  // SubBytes transformation
  subBytes(state) {
    for (let i = 0; i < 16; i++) {
      state[i] = this.SBOX[state[i]];
    }
  },

  // InvSubBytes transformation
  invSubBytes(state) {
    for (let i = 0; i < 16; i++) {
      state[i] = this.INV_SBOX[state[i]];
    }
  },

  // ShiftRows transformation
  shiftRows(state) {
    // Row 1: shift left by 1
    let temp = state[1];
    state[1] = state[5];
    state[5] = state[9];
    state[9] = state[13];
    state[13] = temp;

    // Row 2: shift left by 2
    temp = state[2];
    state[2] = state[10];
    state[10] = temp;
    temp = state[6];
    state[6] = state[14];
    state[14] = temp;

    // Row 3: shift left by 3
    temp = state[15];
    state[15] = state[11];
    state[11] = state[7];
    state[7] = state[3];
    state[3] = temp;
  },

  // InvShiftRows transformation
  invShiftRows(state) {
    // Row 1: shift right by 1
    let temp = state[13];
    state[13] = state[9];
    state[9] = state[5];
    state[5] = state[1];
    state[1] = temp;

    // Row 2: shift right by 2
    temp = state[2];
    state[2] = state[10];
    state[10] = temp;
    temp = state[6];
    state[6] = state[14];
    state[14] = temp;

    // Row 3: shift right by 3
    temp = state[3];
    state[3] = state[7];
    state[7] = state[11];
    state[11] = state[15];
    state[15] = temp;
  },

  // MixColumns transformation
  mixColumns(state) {
    for (let c = 0; c < 4; c++) {
      const i = c * 4;
      const a = [...state.slice(i, i + 4)];
      state[i] = this.gmul(2, a[0]) ^ this.gmul(3, a[1]) ^ a[2] ^ a[3];
      state[i + 1] = a[0] ^ this.gmul(2, a[1]) ^ this.gmul(3, a[2]) ^ a[3];
      state[i + 2] = a[0] ^ a[1] ^ this.gmul(2, a[2]) ^ this.gmul(3, a[3]);
      state[i + 3] = this.gmul(3, a[0]) ^ a[1] ^ a[2] ^ this.gmul(2, a[3]);
    }
  },

  // InvMixColumns transformation
  invMixColumns(state) {
    for (let c = 0; c < 4; c++) {
      const i = c * 4;
      const a = [...state.slice(i, i + 4)];
      state[i] = this.gmul(0x0e, a[0]) ^ this.gmul(0x0b, a[1]) ^ this.gmul(0x0d, a[2]) ^ this.gmul(0x09, a[3]);
      state[i + 1] = this.gmul(0x09, a[0]) ^ this.gmul(0x0e, a[1]) ^ this.gmul(0x0b, a[2]) ^ this.gmul(0x0d, a[3]);
      state[i + 2] = this.gmul(0x0d, a[0]) ^ this.gmul(0x09, a[1]) ^ this.gmul(0x0e, a[2]) ^ this.gmul(0x0b, a[3]);
      state[i + 3] = this.gmul(0x0b, a[0]) ^ this.gmul(0x0d, a[1]) ^ this.gmul(0x09, a[2]) ^ this.gmul(0x0e, a[3]);
    }
  },

  // AddRoundKey transformation
  addRoundKey(state, W, round) {
    for (let c = 0; c < 4; c++) {
      const word = W[round * 4 + c];
      state[c * 4] ^= (word >>> 24) & 0xFF;
      state[c * 4 + 1] ^= (word >>> 16) & 0xFF;
      state[c * 4 + 2] ^= (word >>> 8) & 0xFF;
      state[c * 4 + 3] ^= word & 0xFF;
    }
  },

  // Encrypt single block
  encryptBlock(block, W) {
    const state = new Uint8Array(block);
    const Nr = 14;

    this.addRoundKey(state, W, 0);

    for (let round = 1; round < Nr; round++) {
      this.subBytes(state);
      this.shiftRows(state);
      this.mixColumns(state);
      this.addRoundKey(state, W, round);
    }

    this.subBytes(state);
    this.shiftRows(state);
    this.addRoundKey(state, W, Nr);

    return state;
  },

  // Decrypt single block
  decryptBlock(block, W) {
    const state = new Uint8Array(block);
    const Nr = 14;

    this.addRoundKey(state, W, Nr);

    for (let round = Nr - 1; round > 0; round--) {
      this.invShiftRows(state);
      this.invSubBytes(state);
      this.addRoundKey(state, W, round);
      this.invMixColumns(state);
    }

    this.invShiftRows(state);
    this.invSubBytes(state);
    this.addRoundKey(state, W, 0);

    return state;
  },

  // PKCS7 padding
  pad(data) {
    const blockSize = 16;
    const padLen = blockSize - (data.length % blockSize);
    const padded = new Uint8Array(data.length + padLen);
    padded.set(data);
    for (let i = data.length; i < padded.length; i++) {
      padded[i] = padLen;
    }
    return padded;
  },

  // Remove PKCS7 padding
  unpad(data) {
    const padLen = data[data.length - 1];
    if (padLen > 16 || padLen === 0) throw new Error('Invalid padding');
    for (let i = data.length - padLen; i < data.length; i++) {
      if (data[i] !== padLen) throw new Error('Invalid padding');
    }
    return data.slice(0, data.length - padLen);
  },

  // CBC mode encryption
  encryptCBC(plaintext, key, iv) {
    const W = this.keyExpansion(key);
    const padded = this.pad(plaintext);
    const ciphertext = new Uint8Array(padded.length);
    let prevBlock = new Uint8Array(iv);

    for (let i = 0; i < padded.length; i += 16) {
      const block = new Uint8Array(16);
      for (let j = 0; j < 16; j++) {
        block[j] = padded[i + j] ^ prevBlock[j];
      }
      const encrypted = this.encryptBlock(block, W);
      ciphertext.set(encrypted, i);
      prevBlock = encrypted;
    }

    return ciphertext;
  },

  // CBC mode decryption
  decryptCBC(ciphertext, key, iv) {
    const W = this.keyExpansion(key);
    const plaintext = new Uint8Array(ciphertext.length);
    let prevBlock = new Uint8Array(iv);

    for (let i = 0; i < ciphertext.length; i += 16) {
      const block = ciphertext.slice(i, i + 16);
      const decrypted = this.decryptBlock(block, W);
      for (let j = 0; j < 16; j++) {
        plaintext[i + j] = decrypted[j] ^ prevBlock[j];
      }
      prevBlock = block;
    }

    return this.unpad(plaintext);
  },

  // High-level encrypt (string to base64)
  encrypt(plaintext, password) {
    const key = KonomiSHA256.hashBytes(KonomiUtils.utf8Encode(password));
    const iv = KonomiUtils.randomBytes(16);
    const data = KonomiUtils.utf8Encode(plaintext);
    const encrypted = this.encryptCBC(data, key, iv);

    // Prepend IV to ciphertext
    const result = new Uint8Array(16 + encrypted.length);
    result.set(iv);
    result.set(encrypted, 16);

    return KonomiUtils.base64Encode(result);
  },

  // High-level decrypt (base64 to string)
  decrypt(ciphertext, password) {
    const key = KonomiSHA256.hashBytes(KonomiUtils.utf8Encode(password));
    const data = KonomiUtils.base64Decode(ciphertext);
    const iv = data.slice(0, 16);
    const encrypted = data.slice(16);
    const decrypted = this.decryptCBC(encrypted, key, iv);
    return KonomiUtils.utf8Decode(decrypted);
  }
};
