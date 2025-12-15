// ============================================
// KONOMI KONCEPTION - Testing Framework
// Pure JavaScript - Zero Dependencies
// ============================================

const KonomiTest = {
  suites: [],
  currentSuite: null,
  results: {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    duration: 0,
    failures: []
  },

  // ============================================
  // TEST DEFINITION API
  // ============================================

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeEach: null,
      afterEach: null,
      beforeAll: null,
      afterAll: null
    };

    const prevSuite = this.currentSuite;
    this.currentSuite = suite;

    fn();

    this.currentSuite = prevSuite;
    this.suites.push(suite);

    return suite;
  },

  it(description, fn) {
    if (!this.currentSuite) {
      throw new Error('it() must be called inside describe()');
    }
    this.currentSuite.tests.push({
      description,
      fn,
      skip: false
    });
  },

  skip(description, fn) {
    if (!this.currentSuite) {
      throw new Error('skip() must be called inside describe()');
    }
    this.currentSuite.tests.push({
      description,
      fn,
      skip: true
    });
  },

  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEach = fn;
    }
  },

  afterEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.afterEach = fn;
    }
  },

  beforeAll(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeAll = fn;
    }
  },

  afterAll(fn) {
    if (this.currentSuite) {
      this.currentSuite.afterAll = fn;
    }
  },

  // ============================================
  // ASSERTIONS
  // ============================================

  expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },

      toEqual(expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },

      toBeGreaterThan(expected) {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },

      toBeLessThan(expected) {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },

      toBeGreaterThanOrEqual(expected) {
        if (actual < expected) {
          throw new Error(`Expected ${actual} to be >= ${expected}`);
        }
      },

      toBeLessThanOrEqual(expected) {
        if (actual > expected) {
          throw new Error(`Expected ${actual} to be <= ${expected}`);
        }
      },

      toBeNull() {
        if (actual !== null) {
          throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
        }
      },

      toBeUndefined() {
        if (actual !== undefined) {
          throw new Error(`Expected undefined, got ${JSON.stringify(actual)}`);
        }
      },

      toBeDefined() {
        if (actual === undefined) {
          throw new Error('Expected value to be defined');
        }
      },

      toBeTruthy() {
        if (!actual) {
          throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
        }
      },

      toBeFalsy() {
        if (actual) {
          throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
        }
      },

      toContain(item) {
        if (typeof actual === 'string') {
          if (!actual.includes(item)) {
            throw new Error(`Expected "${actual}" to contain "${item}"`);
          }
        } else if (Array.isArray(actual)) {
          if (!actual.includes(item)) {
            throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
          }
        } else {
          throw new Error('toContain() requires string or array');
        }
      },

      toHaveLength(length) {
        if (actual.length !== length) {
          throw new Error(`Expected length ${length}, got ${actual.length}`);
        }
      },

      toMatch(regex) {
        if (!regex.test(actual)) {
          throw new Error(`Expected "${actual}" to match ${regex}`);
        }
      },

      toThrow(expectedError) {
        let threw = false;
        let error = null;
        try {
          actual();
        } catch (e) {
          threw = true;
          error = e;
        }
        if (!threw) {
          throw new Error('Expected function to throw');
        }
        if (expectedError && !error.message.includes(expectedError)) {
          throw new Error(`Expected error "${expectedError}", got "${error.message}"`);
        }
      },

      toBeCloseTo(expected, precision = 2) {
        const diff = Math.abs(actual - expected);
        const threshold = Math.pow(10, -precision) / 2;
        if (diff > threshold) {
          throw new Error(`Expected ${actual} to be close to ${expected}`);
        }
      },

      toBeInstanceOf(expected) {
        if (!(actual instanceof expected)) {
          throw new Error(`Expected instance of ${expected.name}`);
        }
      },

      toHaveProperty(property, value) {
        if (!(property in actual)) {
          throw new Error(`Expected object to have property "${property}"`);
        }
        if (value !== undefined && actual[property] !== value) {
          throw new Error(`Expected property "${property}" to be ${JSON.stringify(value)}`);
        }
      },

      not: {
        toBe(expected) {
          if (actual === expected) {
            throw new Error(`Expected ${JSON.stringify(actual)} not to be ${JSON.stringify(expected)}`);
          }
        },

        toEqual(expected) {
          if (JSON.stringify(actual) === JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(actual)} not to equal ${JSON.stringify(expected)}`);
          }
        },

        toBeNull() {
          if (actual === null) {
            throw new Error('Expected value not to be null');
          }
        },

        toBeTruthy() {
          if (actual) {
            throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
          }
        },

        toContain(item) {
          if (typeof actual === 'string' && actual.includes(item)) {
            throw new Error(`Expected "${actual}" not to contain "${item}"`);
          } else if (Array.isArray(actual) && actual.includes(item)) {
            throw new Error(`Expected array not to contain ${JSON.stringify(item)}`);
          }
        },

        toThrow() {
          let threw = false;
          try {
            actual();
          } catch (e) {
            threw = true;
          }
          if (threw) {
            throw new Error('Expected function not to throw');
          }
        }
      }
    };
  },

  // ============================================
  // TEST RUNNER
  // ============================================

  async run(options = {}) {
    const { verbose = true, filter = null } = options;

    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      failures: []
    };

    const startTime = performance.now();
    const log = verbose ? console.log.bind(console) : () => {};

    log('\n🧪 KONOMI KONCEPTION TEST RUNNER\n');
    log('='.repeat(50));

    for (const suite of this.suites) {
      if (filter && !suite.name.includes(filter)) continue;

      log(`\n📦 ${suite.name}`);

      // Run beforeAll
      if (suite.beforeAll) {
        try {
          await suite.beforeAll();
        } catch (e) {
          log(`  ❌ beforeAll failed: ${e.message}`);
          continue;
        }
      }

      for (const test of suite.tests) {
        this.results.total++;

        if (test.skip) {
          this.results.skipped++;
          log(`  ⏭️  ${test.description} (skipped)`);
          continue;
        }

        // Run beforeEach
        if (suite.beforeEach) {
          try {
            await suite.beforeEach();
          } catch (e) {
            log(`  ❌ beforeEach failed: ${e.message}`);
            continue;
          }
        }

        // Run test
        try {
          const testStart = performance.now();
          await test.fn();
          const testDuration = (performance.now() - testStart).toFixed(2);
          this.results.passed++;
          log(`  ✅ ${test.description} (${testDuration}ms)`);
        } catch (e) {
          this.results.failed++;
          log(`  ❌ ${test.description}`);
          log(`     Error: ${e.message}`);
          this.results.failures.push({
            suite: suite.name,
            test: test.description,
            error: e.message,
            stack: e.stack
          });
        }

        // Run afterEach
        if (suite.afterEach) {
          try {
            await suite.afterEach();
          } catch (e) {
            log(`  ⚠️  afterEach failed: ${e.message}`);
          }
        }
      }

      // Run afterAll
      if (suite.afterAll) {
        try {
          await suite.afterAll();
        } catch (e) {
          log(`  ⚠️  afterAll failed: ${e.message}`);
        }
      }
    }

    this.results.duration = performance.now() - startTime;

    // Summary
    log('\n' + '='.repeat(50));
    log('\n📊 TEST SUMMARY\n');
    log(`   Total:   ${this.results.total}`);
    log(`   Passed:  ${this.results.passed} ✅`);
    log(`   Failed:  ${this.results.failed} ❌`);
    log(`   Skipped: ${this.results.skipped} ⏭️`);
    log(`   Duration: ${this.results.duration.toFixed(2)}ms`);

    if (this.results.failures.length > 0) {
      log('\n❌ FAILURES:\n');
      for (const failure of this.results.failures) {
        log(`   ${failure.suite} > ${failure.test}`);
        log(`   ${failure.error}\n`);
      }
    }

    log('\n' + '='.repeat(50) + '\n');

    return this.results;
  },

  // Reset all suites
  reset() {
    this.suites = [];
    this.currentSuite = null;
  },

  // ============================================
  // MOCKING
  // ============================================

  mock: {
    fn(implementation = () => {}) {
      const mockFn = function(...args) {
        mockFn.calls.push(args);
        mockFn.callCount++;
        return mockFn.implementation(...args);
      };

      mockFn.calls = [];
      mockFn.callCount = 0;
      mockFn.implementation = implementation;

      mockFn.mockImplementation = (fn) => {
        mockFn.implementation = fn;
        return mockFn;
      };

      mockFn.mockReturnValue = (value) => {
        mockFn.implementation = () => value;
        return mockFn;
      };

      mockFn.mockReset = () => {
        mockFn.calls = [];
        mockFn.callCount = 0;
      };

      return mockFn;
    },

    spyOn(obj, method) {
      const original = obj[method];
      const mock = this.fn(original.bind(obj));
      mock.restore = () => { obj[method] = original; };
      obj[method] = mock;
      return mock;
    }
  },

  // ============================================
  // COVERAGE (Simple)
  // ============================================

  coverage: {
    data: new Map(),

    track(name) {
      if (!this.data.has(name)) {
        this.data.set(name, { calls: 0, lines: new Set() });
      }
      this.data.get(name).calls++;
    },

    trackLine(name, line) {
      if (this.data.has(name)) {
        this.data.get(name).lines.add(line);
      }
    },

    report() {
      console.log('\n📈 COVERAGE REPORT\n');
      for (const [name, info] of this.data) {
        console.log(`   ${name}: ${info.calls} calls, ${info.lines.size} lines`);
      }
    },

    reset() {
      this.data.clear();
    }
  }
};
