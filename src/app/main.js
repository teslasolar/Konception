// ============================================
// KONOMI KONCEPTION - Main Application
// Pure JavaScript - Zero Dependencies
// ============================================

const KonomiApp = {
  version: '1.0.0',
  bootTime: 0,
  ready: false,

  // Components
  components: {
    vm: null,
    db: null,
    ai: null,
    renderer2d: null,
    renderer3d: null
  },

  // UI State
  state: {
    activeTab: 'editor',
    theme: 'dark',
    consoleOutput: []
  },

  // ============================================
  // BOOTSTRAP
  // ============================================

  async boot() {
    const startTime = performance.now();
    this.log('info', 'KONOMI KONCEPTION v' + this.version);
    this.log('info', 'Starting bootstrap sequence...');

    try {
      // Stage 1: Initialize utilities
      this.log('info', '[1/5] Initializing utilities...');
      KonomiUtils.initRandom();
      await this.delay(50);

      // Stage 2: Initialize VM
      this.log('info', '[2/5] Building virtual machine...');
      this.components.vm = KonomiVM;
      await this.delay(50);

      // Stage 3: Initialize Database
      this.log('info', '[3/5] Initializing database...');
      KonomiDB.load();
      this.components.db = KonomiDB;
      await this.delay(50);

      // Stage 4: Initialize AI
      this.log('info', '[4/5] Loading AI engine...');
      this.components.ai = KonomiAI.createModel({
        vocabSize: 256,
        dim: 32,
        numHeads: 2,
        numLayers: 1
      });
      await this.delay(50);

      // Stage 5: Initialize renderers
      this.log('info', '[5/5] Setting up renderers...');
      this.initRenderers();
      await this.delay(50);

      this.bootTime = performance.now() - startTime;
      this.ready = true;

      this.log('success', `System ready in ${this.bootTime.toFixed(0)}ms`);
      this.log('info', '─'.repeat(40));

      // Initialize UI
      this.initUI();

      // Run self-test
      this.runSelfTest();

    } catch (error) {
      this.log('error', 'Boot failed: ' + error.message);
      console.error(error);
    }
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // ============================================
  // RENDERERS
  // ============================================

  initRenderers() {
    // 2D Canvas
    const canvas2d = document.getElementById('canvas2d');
    if (canvas2d) {
      this.components.renderer2d = KonomiRenderer.create2D(canvas2d);
    }

    // 3D Canvas
    const canvas3d = document.getElementById('canvas3d');
    if (canvas3d) {
      this.components.renderer3d = KonomiRenderer.create3D(canvas3d);
    }
  },

  // ============================================
  // UI INITIALIZATION
  // ============================================

  initUI() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        if (target) this.switchTab(target);
      });
    });

    // Run button
    const runBtn = document.getElementById('runBtn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runCode());
    }

    // Test button
    const testBtn = document.getElementById('testBtn');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.runSelfTest());
    }

    // Demo buttons
    document.querySelectorAll('[data-demo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const demo = btn.dataset.demo;
        this.runDemo(demo);
      });
    });

    // Update stats
    this.updateStats();
  },

  switchTab(tab) {
    this.state.activeTab = tab;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.target === tab);
    });

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('hidden', content.id !== tab + '-content');
    });
  },

  // ============================================
  // CODE EXECUTION
  // ============================================

  runCode() {
    const editor = document.getElementById('codeEditor');
    if (!editor) return;

    const code = editor.value;
    this.log('info', 'Executing code...');

    try {
      const output = this.components.vm.execute(code);
      output.forEach(line => this.log('success', '> ' + line));
      this.log('info', 'Execution complete');
    } catch (error) {
      this.log('error', 'Error: ' + error.message);
    }
  },

  // ============================================
  // DEMOS
  // ============================================

  runDemo(demo) {
    switch (demo) {
      case 'crypto':
        this.demoCrypto();
        break;
      case 'db':
        this.demoDatabase();
        break;
      case 'ai':
        this.demoAI();
        break;
      case '3d':
        this.demo3D();
        break;
      case 'compress':
        this.demoCompression();
        break;
    }
  },

  demoCrypto() {
    this.log('info', '── Crypto Demo ──');

    // SHA256
    const message = 'Hello, Konomi Konception!';
    const hash = KonomiSHA256.hash(message);
    this.log('info', 'Message: ' + message);
    this.log('success', 'SHA256: ' + hash);

    // AES Encryption
    const password = 'secret123';
    const encrypted = KonomiAES.encrypt(message, password);
    this.log('info', 'Encrypted: ' + encrypted.substring(0, 40) + '...');

    const decrypted = KonomiAES.decrypt(encrypted, password);
    this.log('success', 'Decrypted: ' + decrypted);

    // UUID
    const uuid = KonomiUtils.uuid();
    this.log('info', 'Generated UUID: ' + uuid);
  },

  demoDatabase() {
    this.log('info', '── Database Demo ──');

    const users = this.components.db.collection('demo_users');
    users.clear();

    // Insert
    const user1 = users.insert({ name: 'Alice', age: 30, role: 'admin' });
    const user2 = users.insert({ name: 'Bob', age: 25, role: 'user' });
    const user3 = users.insert({ name: 'Charlie', age: 35, role: 'user' });

    this.log('success', `Inserted ${users.count()} users`);

    // Query
    const admins = users.find({ role: 'admin' });
    this.log('info', 'Admins: ' + admins.map(u => u.name).join(', '));

    const over30 = users.find({ age: { $gte: 30 } });
    this.log('info', 'Age >= 30: ' + over30.map(u => u.name).join(', '));

    // Update
    users.update(user2._id, { age: 26 });
    this.log('success', 'Updated Bob\'s age to 26');

    // Range query (using B+Tree directly)
    this.log('info', 'All users: ' + users.find().map(u => `${u.name}(${u.age})`).join(', '));
  },

  demoAI() {
    this.log('info', '── AI Demo ──');

    // Text embedding similarity
    const embedding = KonomiAI.createEmbedding(256, 32);

    const texts = [
      'Hello world',
      'Hi there world',
      'Goodbye universe',
      'Machine learning is fun'
    ];

    this.log('info', 'Finding similar texts to "Hello world":');

    const similar = KonomiAI.findSimilar('Hello world', texts, embedding, 3);
    similar.forEach((result, i) => {
      this.log('success', `  ${i + 1}. "${result.document}" (${(result.similarity * 100).toFixed(1)}%)`);
    });

    // Simple classification demo
    const classifier = KonomiAI.createTextClassifier(['positive', 'negative', 'neutral']);
    const predictions = KonomiAI.classifyText(classifier, 'This is great!');

    this.log('info', 'Classification of "This is great!":');
    predictions.slice(0, 3).forEach(p => {
      this.log('info', `  ${p.category}: ${(p.probability * 100).toFixed(1)}%`);
    });
  },

  demo3D() {
    this.log('info', '── 3D Rendering Demo ──');

    const renderer = this.components.renderer3d;
    if (!renderer) {
      this.log('error', '3D canvas not found');
      return;
    }

    // Create cube mesh
    const cube = KonomiRenderer.createCube(1);
    cube.color = [100, 150, 200];

    // Animation loop
    let angle = 0;
    const animate = () => {
      renderer.clear([10, 10, 15]);

      // Rotate cube
      const transform = KonomiRenderer.mat4.multiply(
        KonomiRenderer.mat4.rotationY(angle),
        KonomiRenderer.mat4.rotationX(angle * 0.5)
      );

      renderer.renderMesh(cube, transform);
      renderer.present();

      angle += 0.02;

      if (angle < Math.PI * 4) {
        requestAnimationFrame(animate);
      } else {
        this.log('success', '3D rendering complete');
      }
    };

    animate();
    this.log('info', 'Rendering rotating cube...');
  },

  demoCompression() {
    this.log('info', '── Compression Demo ──');

    const original = 'Hello, Konomi Konception! '.repeat(50);
    this.log('info', `Original size: ${original.length} bytes`);

    const compressed = KonomiCompression.compress(original);
    const ratio = KonomiCompression.getCompressionRatio(original, compressed);

    this.log('success', `Compressed size: ${ratio.compressedSize} bytes`);
    this.log('success', `Compression ratio: ${ratio.ratio}`);

    const decompressed = KonomiCompression.decompress(compressed);
    const decompressedStr = KonomiUtils.utf8Decode(decompressed);

    this.log('info', `Decompressed size: ${decompressedStr.length} bytes`);
    this.log('success', `Integrity check: ${decompressedStr === original ? 'PASSED' : 'FAILED'}`);
  },

  // ============================================
  // SELF TEST
  // ============================================

  async runSelfTest() {
    this.log('info', '── Running Self-Tests ──');

    KonomiTest.reset();

    // Utils tests
    KonomiTest.describe('KonomiUtils', () => {
      KonomiTest.it('generates valid UUIDs', () => {
        const uuid = KonomiUtils.uuid();
        KonomiTest.expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      });

      KonomiTest.it('encodes/decodes base64', () => {
        const original = 'Hello, World!';
        const encoded = KonomiUtils.base64Encode(KonomiUtils.utf8Encode(original));
        const decoded = KonomiUtils.utf8Decode(KonomiUtils.base64Decode(encoded));
        KonomiTest.expect(decoded).toBe(original);
      });

      KonomiTest.it('generates random numbers', () => {
        const num = KonomiUtils.random();
        KonomiTest.expect(num).toBeGreaterThanOrEqual(0);
        KonomiTest.expect(num).toBeLessThan(1);
      });
    });

    // SHA256 tests
    KonomiTest.describe('KonomiSHA256', () => {
      KonomiTest.it('hashes empty string correctly', () => {
        const hash = KonomiSHA256.hash('');
        KonomiTest.expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      });

      KonomiTest.it('hashes "abc" correctly', () => {
        const hash = KonomiSHA256.hash('abc');
        KonomiTest.expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      });
    });

    // Database tests
    KonomiTest.describe('KonomiDB', () => {
      KonomiTest.it('inserts and retrieves documents', () => {
        const col = KonomiDB.collection('test_col');
        col.clear();
        const doc = col.insert({ name: 'test', value: 42 });
        const found = col.findById(doc._id);
        KonomiTest.expect(found.name).toBe('test');
        KonomiTest.expect(found.value).toBe(42);
      });

      KonomiTest.it('supports queries', () => {
        const col = KonomiDB.collection('test_col');
        col.clear();
        col.insert({ type: 'a', n: 1 });
        col.insert({ type: 'b', n: 2 });
        col.insert({ type: 'a', n: 3 });
        const results = col.find({ type: 'a' });
        KonomiTest.expect(results).toHaveLength(2);
      });
    });

    // VM tests
    KonomiTest.describe('KonomiVM', () => {
      KonomiTest.it('executes arithmetic', () => {
        const output = KonomiVM.execute('print(5 + 3);');
        KonomiTest.expect(output[0]).toBe(8);
      });

      KonomiTest.it('handles variables', () => {
        const output = KonomiVM.execute('let x = 10; print(x * 2);');
        KonomiTest.expect(output[0]).toBe(20);
      });

      KonomiTest.it('handles conditionals', () => {
        const output = KonomiVM.execute('let x = 5; if (x > 3) { print(1); } else { print(0); }');
        KonomiTest.expect(output[0]).toBe(1);
      });
    });

    // Run tests
    const results = await KonomiTest.run({ verbose: false });

    this.log('info', `Tests: ${results.passed} passed, ${results.failed} failed`);

    if (results.failed === 0) {
      this.log('success', 'All tests passed!');
    } else {
      results.failures.forEach(f => {
        this.log('error', `FAIL: ${f.suite} > ${f.test}`);
      });
    }
  },

  // ============================================
  // LOGGING
  // ============================================

  log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { type, message, timestamp };
    this.state.consoleOutput.push(entry);

    // Update console UI
    const consoleEl = document.getElementById('console');
    if (consoleEl) {
      const line = document.createElement('div');
      line.className = 'console-line ' + type;
      line.textContent = `[${timestamp}] ${message}`;
      consoleEl.appendChild(line);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    // Also log to browser console
    const consoleFn = type === 'error' ? console.error : type === 'warning' ? console.warn : console.log;
    consoleFn(`[Konomi] ${message}`);
  },

  // ============================================
  // STATS
  // ============================================

  updateStats() {
    const stats = {
      bootTime: this.bootTime.toFixed(0) + 'ms',
      memory: this.getMemoryUsage(),
      dbSize: this.components.db ? this.components.db.list().length : 0,
      uptime: '0s'
    };

    // Update stat displays
    Object.entries(stats).forEach(([key, value]) => {
      const el = document.getElementById('stat-' + key);
      if (el) el.textContent = value;
    });

    // Update uptime periodically
    setInterval(() => {
      const uptime = Math.floor((performance.now() - this.bootTime) / 1000);
      const el = document.getElementById('stat-uptime');
      if (el) el.textContent = uptime + 's';
    }, 1000);
  },

  getMemoryUsage() {
    if (performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB';
    }
    return 'N/A';
  },

  // ============================================
  // PERSISTENCE
  // ============================================

  saveState() {
    const state = {
      version: this.version,
      timestamp: Date.now(),
      consoleOutput: this.state.consoleOutput.slice(-100)
    };
    localStorage.setItem('konomi_state', JSON.stringify(state));
    this.components.db.save();
  },

  loadState() {
    const state = localStorage.getItem('konomi_state');
    if (state) {
      try {
        const parsed = JSON.parse(state);
        this.state.consoleOutput = parsed.consoleOutput || [];
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }
};

// ============================================
// BOOTSTRAP ON LOAD
// ============================================

window.addEventListener('DOMContentLoaded', () => {
  KonomiApp.boot();
});

// Auto-save state periodically
setInterval(() => {
  if (KonomiApp.ready) {
    KonomiApp.saveState();
  }
}, 30000);
