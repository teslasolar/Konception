// ============================================
// KONOMI KONCEPTION - LZ77 + Huffman Compression
// Pure JavaScript - Zero Dependencies
// ============================================

const KonomiCompression = {
  // LZ77 Constants
  WINDOW_SIZE: 32768,  // 32KB sliding window
  MIN_MATCH: 3,
  MAX_MATCH: 258,

  // ============================================
  // LZ77 COMPRESSION
  // ============================================

  lz77Encode(data) {
    const result = [];
    let pos = 0;

    while (pos < data.length) {
      let bestOffset = 0;
      let bestLength = 0;

      // Search window start
      const windowStart = Math.max(0, pos - this.WINDOW_SIZE);

      // Find longest match in window
      for (let i = windowStart; i < pos; i++) {
        let length = 0;
        while (
          length < this.MAX_MATCH &&
          pos + length < data.length &&
          data[i + length] === data[pos + length]
        ) {
          length++;
        }

        if (length >= this.MIN_MATCH && length > bestLength) {
          bestOffset = pos - i;
          bestLength = length;
        }
      }

      if (bestLength >= this.MIN_MATCH) {
        // Output (offset, length) pair
        result.push({ type: 'match', offset: bestOffset, length: bestLength });
        pos += bestLength;
      } else {
        // Output literal byte
        result.push({ type: 'literal', value: data[pos] });
        pos++;
      }
    }

    return result;
  },

  lz77Decode(tokens) {
    const result = [];

    for (const token of tokens) {
      if (token.type === 'literal') {
        result.push(token.value);
      } else {
        const start = result.length - token.offset;
        for (let i = 0; i < token.length; i++) {
          result.push(result[start + i]);
        }
      }
    }

    return new Uint8Array(result);
  },

  // ============================================
  // HUFFMAN CODING
  // ============================================

  // Build frequency table
  buildFrequencyTable(data) {
    const freq = new Map();
    for (const byte of data) {
      freq.set(byte, (freq.get(byte) || 0) + 1);
    }
    return freq;
  },

  // Build Huffman tree
  buildHuffmanTree(freq) {
    // Create leaf nodes
    const nodes = [];
    for (const [value, count] of freq) {
      nodes.push({ value, count, left: null, right: null });
    }

    // Handle edge case
    if (nodes.length === 0) return null;
    if (nodes.length === 1) {
      return { value: null, count: nodes[0].count, left: nodes[0], right: null };
    }

    // Build tree using priority queue (simple array-based)
    while (nodes.length > 1) {
      nodes.sort((a, b) => a.count - b.count);
      const left = nodes.shift();
      const right = nodes.shift();
      nodes.push({
        value: null,
        count: left.count + right.count,
        left,
        right
      });
    }

    return nodes[0];
  },

  // Generate Huffman codes from tree
  generateCodes(tree, prefix = '', codes = new Map()) {
    if (!tree) return codes;

    if (tree.value !== null) {
      codes.set(tree.value, prefix || '0');
    } else {
      this.generateCodes(tree.left, prefix + '0', codes);
      this.generateCodes(tree.right, prefix + '1', codes);
    }

    return codes;
  },

  // Encode data with Huffman codes
  huffmanEncode(data) {
    const freq = this.buildFrequencyTable(data);
    const tree = this.buildHuffmanTree(freq);
    const codes = this.generateCodes(tree);

    // Build bit string
    let bitString = '';
    for (const byte of data) {
      bitString += codes.get(byte);
    }

    // Convert to bytes
    const paddingBits = (8 - (bitString.length % 8)) % 8;
    bitString += '0'.repeat(paddingBits);

    const bytes = new Uint8Array(bitString.length / 8);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bitString.substr(i * 8, 8), 2);
    }

    return {
      data: bytes,
      tree: this.serializeTree(tree),
      originalLength: data.length,
      paddingBits
    };
  },

  // Serialize Huffman tree for storage
  serializeTree(tree) {
    if (!tree) return null;
    if (tree.value !== null) {
      return { v: tree.value };
    }
    return {
      l: this.serializeTree(tree.left),
      r: this.serializeTree(tree.right)
    };
  },

  // Deserialize Huffman tree
  deserializeTree(data) {
    if (!data) return null;
    if ('v' in data) {
      return { value: data.v, left: null, right: null };
    }
    return {
      value: null,
      left: this.deserializeTree(data.l),
      right: this.deserializeTree(data.r)
    };
  },

  // Decode Huffman encoded data
  huffmanDecode(encoded) {
    const tree = this.deserializeTree(encoded.tree);
    if (!tree) return new Uint8Array(0);

    // Convert bytes to bit string
    let bitString = '';
    for (const byte of encoded.data) {
      bitString += byte.toString(2).padStart(8, '0');
    }

    // Remove padding
    bitString = bitString.slice(0, bitString.length - encoded.paddingBits);

    // Decode using tree
    const result = [];
    let node = tree;
    for (const bit of bitString) {
      node = bit === '0' ? node.left : node.right;
      if (node.value !== null) {
        result.push(node.value);
        node = tree;
      }
    }

    return new Uint8Array(result);
  },

  // ============================================
  // COMBINED LZ77 + HUFFMAN
  // ============================================

  // Serialize LZ77 tokens to bytes
  serializeLZ77(tokens) {
    const bytes = [];

    for (const token of tokens) {
      if (token.type === 'literal') {
        bytes.push(0); // Flag: literal
        bytes.push(token.value);
      } else {
        bytes.push(1); // Flag: match
        // Offset as 2 bytes
        bytes.push((token.offset >> 8) & 0xFF);
        bytes.push(token.offset & 0xFF);
        // Length as 1 byte (adjusted for MIN_MATCH)
        bytes.push(token.length - this.MIN_MATCH);
      }
    }

    return new Uint8Array(bytes);
  },

  // Deserialize LZ77 tokens from bytes
  deserializeLZ77(bytes) {
    const tokens = [];
    let i = 0;

    while (i < bytes.length) {
      const flag = bytes[i++];
      if (flag === 0) {
        tokens.push({ type: 'literal', value: bytes[i++] });
      } else {
        const offset = (bytes[i++] << 8) | bytes[i++];
        const length = bytes[i++] + this.MIN_MATCH;
        tokens.push({ type: 'match', offset, length });
      }
    }

    return tokens;
  },

  // Full compression: LZ77 -> Huffman
  compress(data) {
    if (typeof data === 'string') {
      data = KonomiUtils.utf8Encode(data);
    }

    // Stage 1: LZ77
    const lz77Tokens = this.lz77Encode(data);
    const lz77Bytes = this.serializeLZ77(lz77Tokens);

    // Stage 2: Huffman
    const huffmanEncoded = this.huffmanEncode(lz77Bytes);

    // Package result
    return {
      version: 1,
      originalSize: data.length,
      lz77Size: lz77Bytes.length,
      compressedSize: huffmanEncoded.data.length,
      huffman: huffmanEncoded
    };
  },

  // Full decompression: Huffman -> LZ77
  decompress(compressed) {
    // Stage 1: Huffman decode
    const lz77Bytes = this.huffmanDecode(compressed.huffman);

    // Stage 2: LZ77 decode
    const tokens = this.deserializeLZ77(lz77Bytes);
    const data = this.lz77Decode(tokens);

    return data;
  },

  // Compress to base64 string
  compressToString(data) {
    const compressed = this.compress(data);
    return KonomiUtils.base64Encode(
      KonomiUtils.utf8Encode(JSON.stringify(compressed))
    );
  },

  // Decompress from base64 string
  decompressFromString(str) {
    const compressed = JSON.parse(
      KonomiUtils.utf8Decode(KonomiUtils.base64Decode(str))
    );
    // Reconstruct Uint8Array from data
    compressed.huffman.data = new Uint8Array(Object.values(compressed.huffman.data));
    return this.decompress(compressed);
  },

  // Get compression ratio
  getCompressionRatio(original, compressed) {
    const originalSize = typeof original === 'string' ? original.length : original.length;
    return {
      originalSize,
      compressedSize: compressed.compressedSize,
      ratio: ((1 - compressed.compressedSize / originalSize) * 100).toFixed(2) + '%'
    };
  }
};
