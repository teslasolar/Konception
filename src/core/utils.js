// ============================================
// KONOMI KONCEPTION - Core Utilities
// Zero Dependencies - Pure JavaScript
// ============================================

const KonomiUtils = {
  // CSPRNG - Cryptographically Secure Pseudo-Random Number Generator
  _seed: Date.now() ^ (Math.random() * 0xFFFFFFFF),
  _state: [0, 0, 0, 0],

  initRandom() {
    const seed = Date.now() ^ (Math.random() * 0xFFFFFFFF) ^ (performance.now() * 1000);
    this._state[0] = seed >>> 0;
    this._state[1] = (seed * 1103515245 + 12345) >>> 0;
    this._state[2] = (this._state[1] * 1103515245 + 12345) >>> 0;
    this._state[3] = (this._state[2] * 1103515245 + 12345) >>> 0;
  },

  // Xorshift128+ algorithm
  random() {
    let s1 = this._state[0];
    let s0 = this._state[1];
    const result = (s0 + s1) >>> 0;
    this._state[0] = s0;
    s1 ^= s1 << 23;
    this._state[1] = s1 ^ s0 ^ (s1 >>> 17) ^ (s0 >>> 26);
    return result / 0xFFFFFFFF;
  },

  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  },

  randomBytes(length) {
    const bytes = new Uint8Array(length);
    // Use crypto.getRandomValues if available, fallback to our CSPRNG
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < length; i++) {
        bytes[i] = this.randomInt(0, 255);
      }
    }
    return bytes;
  },

  // String utilities
  utf8Encode(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      let charCode = str.charCodeAt(i);
      if (charCode < 0x80) {
        bytes.push(charCode);
      } else if (charCode < 0x800) {
        bytes.push(0xC0 | (charCode >> 6), 0x80 | (charCode & 0x3F));
      } else if (charCode < 0x10000) {
        bytes.push(0xE0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3F), 0x80 | (charCode & 0x3F));
      } else {
        bytes.push(0xF0 | (charCode >> 18), 0x80 | ((charCode >> 12) & 0x3F), 0x80 | ((charCode >> 6) & 0x3F), 0x80 | (charCode & 0x3F));
      }
    }
    return new Uint8Array(bytes);
  },

  utf8Decode(bytes) {
    let str = '';
    let i = 0;
    while (i < bytes.length) {
      let byte1 = bytes[i++];
      if (byte1 < 0x80) {
        str += String.fromCharCode(byte1);
      } else if (byte1 < 0xE0) {
        str += String.fromCharCode(((byte1 & 0x1F) << 6) | (bytes[i++] & 0x3F));
      } else if (byte1 < 0xF0) {
        str += String.fromCharCode(((byte1 & 0x0F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F));
      } else {
        const codePoint = ((byte1 & 0x07) << 18) | ((bytes[i++] & 0x3F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F);
        str += String.fromCodePoint(codePoint);
      }
    }
    return str;
  },

  // Base64 encoding/decoding
  base64Chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

  base64Encode(bytes) {
    let result = '';
    const len = bytes.length;
    for (let i = 0; i < len; i += 3) {
      const b1 = bytes[i];
      const b2 = i + 1 < len ? bytes[i + 1] : 0;
      const b3 = i + 2 < len ? bytes[i + 2] : 0;
      result += this.base64Chars[b1 >> 2];
      result += this.base64Chars[((b1 & 0x03) << 4) | (b2 >> 4)];
      result += i + 1 < len ? this.base64Chars[((b2 & 0x0F) << 2) | (b3 >> 6)] : '=';
      result += i + 2 < len ? this.base64Chars[b3 & 0x3F] : '=';
    }
    return result;
  },

  base64Decode(str) {
    const bytes = [];
    str = str.replace(/=/g, '');
    for (let i = 0; i < str.length; i += 4) {
      const b1 = this.base64Chars.indexOf(str[i]);
      const b2 = this.base64Chars.indexOf(str[i + 1]);
      const b3 = i + 2 < str.length ? this.base64Chars.indexOf(str[i + 2]) : 0;
      const b4 = i + 3 < str.length ? this.base64Chars.indexOf(str[i + 3]) : 0;
      bytes.push((b1 << 2) | (b2 >> 4));
      if (i + 2 < str.length) bytes.push(((b2 & 0x0F) << 4) | (b3 >> 2));
      if (i + 3 < str.length) bytes.push(((b3 & 0x03) << 6) | b4);
    }
    return new Uint8Array(bytes);
  },

  // Hex encoding/decoding
  hexEncode(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  hexDecode(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
  },

  // Deep clone
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  // Event emitter mixin
  createEventEmitter() {
    const listeners = {};
    return {
      on(event, callback) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
        return () => this.off(event, callback);
      },
      off(event, callback) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      },
      emit(event, ...args) {
        if (!listeners[event]) return;
        listeners[event].forEach(cb => cb(...args));
      }
    };
  },

  // Timestamp
  now() {
    return Date.now();
  },

  // UUID v4 generator
  uuid() {
    const bytes = this.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0F) | 0x40;
    bytes[8] = (bytes[8] & 0x3F) | 0x80;
    const hex = this.hexEncode(bytes);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
};

// Initialize random state
KonomiUtils.initRandom();
