// ============================================
// KONOMI KONCEPTION - Mini Transformer AI
// Pure JavaScript - Zero Dependencies
// ============================================

const KonomiAI = {
  // ============================================
  // MATH UTILITIES
  // ============================================

  // Matrix operations
  zeros(rows, cols) {
    return Array(rows).fill().map(() => Array(cols).fill(0));
  },

  randomMatrix(rows, cols, scale = 0.1) {
    return Array(rows).fill().map(() =>
      Array(cols).fill().map(() => (Math.random() - 0.5) * scale)
    );
  },

  // Matrix multiplication: A @ B
  matmul(A, B) {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const result = this.zeros(rowsA, colsB);

    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  },

  // Matrix-vector multiplication
  matvec(A, v) {
    return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
  },

  // Transpose matrix
  transpose(A) {
    const rows = A.length;
    const cols = A[0].length;
    const result = this.zeros(cols, rows);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = A[i][j];
      }
    }
    return result;
  },

  // Element-wise operations
  add(A, B) {
    if (Array.isArray(A[0])) {
      return A.map((row, i) => row.map((val, j) => val + B[i][j]));
    }
    return A.map((val, i) => val + B[i]);
  },

  scale(A, s) {
    if (Array.isArray(A[0])) {
      return A.map(row => row.map(val => val * s));
    }
    return A.map(val => val * s);
  },

  // ============================================
  // ACTIVATION FUNCTIONS
  // ============================================

  softmax(x) {
    const max = Math.max(...x);
    const exp = x.map(v => Math.exp(v - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(v => v / sum);
  },

  softmax2D(A) {
    return A.map(row => this.softmax(row));
  },

  relu(x) {
    if (Array.isArray(x[0])) {
      return x.map(row => row.map(v => Math.max(0, v)));
    }
    return x.map(v => Math.max(0, v));
  },

  gelu(x) {
    // Gaussian Error Linear Unit approximation
    const f = v => 0.5 * v * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (v + 0.044715 * v * v * v)));
    if (Array.isArray(x[0])) {
      return x.map(row => row.map(f));
    }
    return x.map(f);
  },

  // ============================================
  // LAYER NORMALIZATION
  // ============================================

  layerNorm(x, gamma = null, beta = null, eps = 1e-5) {
    const mean = x.reduce((a, b) => a + b, 0) / x.length;
    const variance = x.reduce((a, v) => a + (v - mean) ** 2, 0) / x.length;
    const std = Math.sqrt(variance + eps);

    let normalized = x.map(v => (v - mean) / std);

    if (gamma && beta) {
      normalized = normalized.map((v, i) => v * gamma[i] + beta[i]);
    }

    return normalized;
  },

  // ============================================
  // EMBEDDING
  // ============================================

  createEmbedding(vocabSize, dim) {
    return this.randomMatrix(vocabSize, dim, Math.sqrt(2 / dim));
  },

  embed(tokens, embeddingMatrix) {
    return tokens.map(t => [...embeddingMatrix[t]]);
  },

  // Positional encoding (sinusoidal)
  positionalEncoding(seqLen, dim) {
    const pe = this.zeros(seqLen, dim);
    for (let pos = 0; pos < seqLen; pos++) {
      for (let i = 0; i < dim; i += 2) {
        const angle = pos / Math.pow(10000, i / dim);
        pe[pos][i] = Math.sin(angle);
        if (i + 1 < dim) pe[pos][i + 1] = Math.cos(angle);
      }
    }
    return pe;
  },

  // ============================================
  // ATTENTION MECHANISM
  // ============================================

  // Scaled dot-product attention
  attention(Q, K, V, mask = null) {
    const dk = K[0].length;
    const scale = Math.sqrt(dk);

    // Q @ K^T / sqrt(dk)
    const KT = this.transpose(K);
    let scores = this.matmul(Q, KT);
    scores = this.scale(scores, 1 / scale);

    // Apply mask if provided
    if (mask) {
      for (let i = 0; i < scores.length; i++) {
        for (let j = 0; j < scores[0].length; j++) {
          if (mask[i][j] === 0) {
            scores[i][j] = -1e9;
          }
        }
      }
    }

    // Softmax
    const attnWeights = this.softmax2D(scores);

    // attn_weights @ V
    return this.matmul(attnWeights, V);
  },

  // Multi-head attention
  multiHeadAttention(Q, K, V, numHeads, Wq, Wk, Wv, Wo) {
    const seqLen = Q.length;
    const dim = Q[0].length;
    const headDim = Math.floor(dim / numHeads);

    // Project Q, K, V
    const projQ = this.matmul(Q, Wq);
    const projK = this.matmul(K, Wk);
    const projV = this.matmul(V, Wv);

    // Split into heads and compute attention
    const heads = [];
    for (let h = 0; h < numHeads; h++) {
      const startIdx = h * headDim;
      const endIdx = startIdx + headDim;

      const Qh = projQ.map(row => row.slice(startIdx, endIdx));
      const Kh = projK.map(row => row.slice(startIdx, endIdx));
      const Vh = projV.map(row => row.slice(startIdx, endIdx));

      heads.push(this.attention(Qh, Kh, Vh));
    }

    // Concatenate heads
    const concat = heads[0].map((_, i) =>
      heads.reduce((acc, head) => acc.concat(head[i]), [])
    );

    // Final projection
    return this.matmul(concat, Wo);
  },

  // ============================================
  // FEED-FORWARD NETWORK
  // ============================================

  feedForward(x, W1, b1, W2, b2) {
    // First linear layer
    let hidden = this.matmul(x, W1);
    hidden = hidden.map((row, i) => row.map((v, j) => v + b1[j]));

    // GELU activation
    hidden = this.gelu(hidden);

    // Second linear layer
    let output = this.matmul(hidden, W2);
    output = output.map((row, i) => row.map((v, j) => v + b2[j]));

    return output;
  },

  // ============================================
  // TRANSFORMER BLOCK
  // ============================================

  transformerBlock(x, params) {
    const { numHeads, Wq, Wk, Wv, Wo, W1, b1, W2, b2, gamma1, beta1, gamma2, beta2 } = params;

    // Self-attention with residual connection
    const attnOut = this.multiHeadAttention(x, x, x, numHeads, Wq, Wk, Wv, Wo);
    let hidden = this.add(x, attnOut);
    hidden = hidden.map(row => this.layerNorm(row, gamma1, beta1));

    // Feed-forward with residual connection
    const ffnOut = this.feedForward(hidden, W1, b1, W2, b2);
    let output = this.add(hidden, ffnOut);
    output = output.map(row => this.layerNorm(row, gamma2, beta2));

    return output;
  },

  // ============================================
  // MINI TRANSFORMER MODEL
  // ============================================

  createModel(config = {}) {
    const {
      vocabSize = 256,      // Character-level by default
      dim = 64,             // Embedding dimension
      numHeads = 4,         // Attention heads
      numLayers = 2,        // Transformer blocks
      ffnDim = 128,         // Feed-forward hidden dimension
      maxSeqLen = 128       // Maximum sequence length
    } = config;

    const model = {
      config: { vocabSize, dim, numHeads, numLayers, ffnDim, maxSeqLen },

      // Embedding
      embedding: this.createEmbedding(vocabSize, dim),
      posEncoding: this.positionalEncoding(maxSeqLen, dim),

      // Transformer layers
      layers: Array(numLayers).fill().map(() => ({
        Wq: this.randomMatrix(dim, dim, Math.sqrt(2 / dim)),
        Wk: this.randomMatrix(dim, dim, Math.sqrt(2 / dim)),
        Wv: this.randomMatrix(dim, dim, Math.sqrt(2 / dim)),
        Wo: this.randomMatrix(dim, dim, Math.sqrt(2 / dim)),
        W1: this.randomMatrix(dim, ffnDim, Math.sqrt(2 / dim)),
        b1: Array(ffnDim).fill(0),
        W2: this.randomMatrix(ffnDim, dim, Math.sqrt(2 / ffnDim)),
        b2: Array(dim).fill(0),
        gamma1: Array(dim).fill(1),
        beta1: Array(dim).fill(0),
        gamma2: Array(dim).fill(1),
        beta2: Array(dim).fill(0),
        numHeads
      })),

      // Output projection
      outputProj: this.randomMatrix(dim, vocabSize, Math.sqrt(2 / dim))
    };

    return model;
  },

  // Forward pass
  forward(model, tokens) {
    const { embedding, posEncoding, layers, outputProj, config } = model;
    const seqLen = tokens.length;

    // Embed tokens and add positional encoding
    let x = this.embed(tokens, embedding);
    for (let i = 0; i < seqLen; i++) {
      x[i] = this.add(x[i], posEncoding[i]);
    }

    // Pass through transformer layers
    for (const layer of layers) {
      x = this.transformerBlock(x, layer);
    }

    // Project to vocabulary
    const logits = this.matmul(x, outputProj);

    return logits;
  },

  // Generate text
  generate(model, prompt, maxNewTokens = 50, temperature = 1.0) {
    let tokens = this.tokenize(prompt);
    const { maxSeqLen } = model.config;

    for (let i = 0; i < maxNewTokens; i++) {
      // Truncate if needed
      const input = tokens.slice(-maxSeqLen);

      // Forward pass
      const logits = this.forward(model, input);

      // Get last position logits and apply temperature
      const lastLogits = logits[logits.length - 1].map(l => l / temperature);

      // Sample from distribution
      const probs = this.softmax(lastLogits);
      const nextToken = this.sample(probs);

      tokens.push(nextToken);
    }

    return this.detokenize(tokens);
  },

  // Simple character-level tokenization
  tokenize(text) {
    return text.split('').map(c => c.charCodeAt(0) % 256);
  },

  detokenize(tokens) {
    return tokens.map(t => String.fromCharCode(t)).join('');
  },

  // Sample from probability distribution
  sample(probs) {
    const r = Math.random();
    let cumsum = 0;
    for (let i = 0; i < probs.length; i++) {
      cumsum += probs[i];
      if (r < cumsum) return i;
    }
    return probs.length - 1;
  },

  // ============================================
  // SIMPLE CLASSIFIER
  // ============================================

  createClassifier(inputDim, hiddenDim, numClasses) {
    return {
      W1: this.randomMatrix(inputDim, hiddenDim, Math.sqrt(2 / inputDim)),
      b1: Array(hiddenDim).fill(0),
      W2: this.randomMatrix(hiddenDim, numClasses, Math.sqrt(2 / hiddenDim)),
      b2: Array(numClasses).fill(0)
    };
  },

  classifierForward(classifier, x) {
    const { W1, b1, W2, b2 } = classifier;

    // First layer
    let hidden = this.matvec(W1, x);
    hidden = hidden.map((v, i) => Math.max(0, v + b1[i])); // ReLU

    // Output layer
    let output = this.matvec(this.transpose(W2), hidden);
    output = output.map((v, i) => v + b2[i]);

    return this.softmax(output);
  },

  // ============================================
  // SIMPLE TEXT CLASSIFIER
  // ============================================

  createTextClassifier(categories) {
    const model = {
      categories,
      vocabSize: 256,
      embedDim: 32,
      embedding: this.createEmbedding(256, 32),
      classifier: this.createClassifier(32, 64, categories.length)
    };
    return model;
  },

  classifyText(model, text) {
    const tokens = this.tokenize(text);

    // Average pooling of embeddings
    let pooled = Array(model.embedDim).fill(0);
    for (const token of tokens) {
      const emb = model.embedding[token];
      for (let i = 0; i < model.embedDim; i++) {
        pooled[i] += emb[i] / tokens.length;
      }
    }

    // Classify
    const probs = this.classifierForward(model.classifier, pooled);

    // Return predictions
    return model.categories.map((cat, i) => ({
      category: cat,
      probability: probs[i]
    })).sort((a, b) => b.probability - a.probability);
  },

  // ============================================
  // SIMILARITY & EMBEDDINGS
  // ============================================

  // Cosine similarity
  cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  },

  // Get text embedding (average of character embeddings)
  getTextEmbedding(text, embedding) {
    const tokens = this.tokenize(text);
    const dim = embedding[0].length;
    const result = Array(dim).fill(0);

    for (const token of tokens) {
      const emb = embedding[token];
      for (let i = 0; i < dim; i++) {
        result[i] += emb[i] / tokens.length;
      }
    }

    return result;
  },

  // Find similar texts
  findSimilar(query, documents, embedding, topK = 5) {
    const queryEmb = this.getTextEmbedding(query, embedding);

    const scores = documents.map((doc, i) => ({
      index: i,
      document: doc,
      similarity: this.cosineSimilarity(queryEmb, this.getTextEmbedding(doc, embedding))
    }));

    return scores.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }
};
