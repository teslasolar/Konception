// ============================================
// KONOMI KONCEPTION - Virtual Machine
// Bytecode Compiler & Interpreter
// Pure JavaScript - Zero Dependencies
// ============================================

const KonomiVM = {
  // Bytecode opcodes
  OP: {
    // Stack operations
    NOP: 0x00,
    PUSH: 0x01,
    POP: 0x02,
    DUP: 0x03,
    SWAP: 0x04,

    // Arithmetic
    ADD: 0x10,
    SUB: 0x11,
    MUL: 0x12,
    DIV: 0x13,
    MOD: 0x14,
    NEG: 0x15,

    // Comparison
    EQ: 0x20,
    NEQ: 0x21,
    LT: 0x22,
    LTE: 0x23,
    GT: 0x24,
    GTE: 0x25,

    // Logic
    AND: 0x30,
    OR: 0x31,
    NOT: 0x32,

    // Variables
    LOAD: 0x40,
    STORE: 0x41,
    LOAD_GLOBAL: 0x42,
    STORE_GLOBAL: 0x43,

    // Control flow
    JMP: 0x50,
    JZ: 0x51,      // Jump if zero
    JNZ: 0x52,     // Jump if not zero

    // Functions
    CALL: 0x60,
    RET: 0x61,
    CALL_NATIVE: 0x62,

    // Objects/Arrays
    NEW_ARRAY: 0x70,
    ARRAY_GET: 0x71,
    ARRAY_SET: 0x72,
    ARRAY_LEN: 0x73,
    NEW_OBJ: 0x74,
    OBJ_GET: 0x75,
    OBJ_SET: 0x76,

    // I/O
    PRINT: 0x80,
    INPUT: 0x81,

    // System
    HALT: 0xFF
  },

  // Token types for lexer
  TOKEN: {
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    IDENTIFIER: 'IDENTIFIER',
    KEYWORD: 'KEYWORD',
    OPERATOR: 'OPERATOR',
    PUNCTUATION: 'PUNCTUATION',
    EOF: 'EOF'
  },

  KEYWORDS: ['let', 'const', 'if', 'else', 'while', 'for', 'function', 'return', 'true', 'false', 'null', 'print'],
  OPERATORS: ['+', '-', '*', '/', '%', '=', '==', '!=', '<', '<=', '>', '>=', '&&', '||', '!'],
  PUNCTUATION: ['(', ')', '{', '}', '[', ']', ',', ';', ':'],

  // ============================================
  // LEXER
  // ============================================

  tokenize(source) {
    const tokens = [];
    let pos = 0;
    let line = 1;
    let col = 1;

    const peek = () => source[pos];
    const advance = () => {
      const ch = source[pos++];
      if (ch === '\n') { line++; col = 1; }
      else { col++; }
      return ch;
    };
    const match = (ch) => peek() === ch && advance();

    while (pos < source.length) {
      const start = { line, col };

      // Skip whitespace
      if (/\s/.test(peek())) {
        advance();
        continue;
      }

      // Skip comments
      if (peek() === '/' && source[pos + 1] === '/') {
        while (peek() && peek() !== '\n') advance();
        continue;
      }

      // Numbers
      if (/\d/.test(peek()) || (peek() === '.' && /\d/.test(source[pos + 1]))) {
        let value = '';
        while (/[\d.]/.test(peek())) value += advance();
        tokens.push({ type: this.TOKEN.NUMBER, value: parseFloat(value), start });
        continue;
      }

      // Strings
      if (peek() === '"' || peek() === "'") {
        const quote = advance();
        let value = '';
        while (peek() && peek() !== quote) {
          if (peek() === '\\') {
            advance();
            const esc = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', "'": "'" };
            value += esc[advance()] || '';
          } else {
            value += advance();
          }
        }
        advance(); // closing quote
        tokens.push({ type: this.TOKEN.STRING, value, start });
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(peek())) {
        let value = '';
        while (/[a-zA-Z0-9_]/.test(peek())) value += advance();
        const type = this.KEYWORDS.includes(value) ? this.TOKEN.KEYWORD : this.TOKEN.IDENTIFIER;
        tokens.push({ type, value, start });
        continue;
      }

      // Operators (multi-char first)
      let matched = false;
      for (const op of ['==', '!=', '<=', '>=', '&&', '||']) {
        if (source.substr(pos, op.length) === op) {
          tokens.push({ type: this.TOKEN.OPERATOR, value: op, start });
          pos += op.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // Single-char operators
      if (this.OPERATORS.includes(peek())) {
        tokens.push({ type: this.TOKEN.OPERATOR, value: advance(), start });
        continue;
      }

      // Punctuation
      if (this.PUNCTUATION.includes(peek())) {
        tokens.push({ type: this.TOKEN.PUNCTUATION, value: advance(), start });
        continue;
      }

      throw new Error(`Unexpected character '${peek()}' at line ${line}, col ${col}`);
    }

    tokens.push({ type: this.TOKEN.EOF, value: null, start: { line, col } });
    return tokens;
  },

  // ============================================
  // PARSER
  // ============================================

  parse(tokens) {
    let pos = 0;

    const peek = () => tokens[pos];
    const advance = () => tokens[pos++];
    const expect = (type, value) => {
      const token = advance();
      if (token.type !== type || (value !== undefined && token.value !== value)) {
        throw new Error(`Expected ${type} ${value || ''}, got ${token.type} ${token.value}`);
      }
      return token;
    };
    const check = (type, value) => {
      const token = peek();
      return token.type === type && (value === undefined || token.value === value);
    };

    // Expression parsing with precedence
    const parseExpression = (minPrec = 0) => {
      let left = parseUnary();

      while (true) {
        const token = peek();
        if (token.type !== this.TOKEN.OPERATOR) break;

        const prec = {
          '||': 1, '&&': 2,
          '==': 3, '!=': 3,
          '<': 4, '<=': 4, '>': 4, '>=': 4,
          '+': 5, '-': 5,
          '*': 6, '/': 6, '%': 6
        }[token.value];

        if (prec === undefined || prec < minPrec) break;

        advance();
        const right = parseExpression(prec + 1);
        left = { type: 'BinaryExpr', op: token.value, left, right };
      }

      return left;
    };

    const parseUnary = () => {
      if (check(this.TOKEN.OPERATOR, '-') || check(this.TOKEN.OPERATOR, '!')) {
        const op = advance().value;
        return { type: 'UnaryExpr', op, operand: parseUnary() };
      }
      return parsePostfix();
    };

    const parsePostfix = () => {
      let expr = parsePrimary();

      while (true) {
        if (check(this.TOKEN.PUNCTUATION, '(')) {
          advance();
          const args = [];
          while (!check(this.TOKEN.PUNCTUATION, ')')) {
            args.push(parseExpression());
            if (!check(this.TOKEN.PUNCTUATION, ')')) expect(this.TOKEN.PUNCTUATION, ',');
          }
          expect(this.TOKEN.PUNCTUATION, ')');
          expr = { type: 'CallExpr', callee: expr, args };
        } else if (check(this.TOKEN.PUNCTUATION, '[')) {
          advance();
          const index = parseExpression();
          expect(this.TOKEN.PUNCTUATION, ']');
          expr = { type: 'IndexExpr', object: expr, index };
        } else {
          break;
        }
      }

      return expr;
    };

    const parsePrimary = () => {
      const token = peek();

      if (token.type === this.TOKEN.NUMBER) {
        advance();
        return { type: 'NumberLiteral', value: token.value };
      }

      if (token.type === this.TOKEN.STRING) {
        advance();
        return { type: 'StringLiteral', value: token.value };
      }

      if (token.type === this.TOKEN.KEYWORD) {
        if (token.value === 'true' || token.value === 'false') {
          advance();
          return { type: 'BooleanLiteral', value: token.value === 'true' };
        }
        if (token.value === 'null') {
          advance();
          return { type: 'NullLiteral' };
        }
      }

      if (token.type === this.TOKEN.IDENTIFIER) {
        advance();
        return { type: 'Identifier', name: token.value };
      }

      if (check(this.TOKEN.PUNCTUATION, '(')) {
        advance();
        const expr = parseExpression();
        expect(this.TOKEN.PUNCTUATION, ')');
        return expr;
      }

      if (check(this.TOKEN.PUNCTUATION, '[')) {
        advance();
        const elements = [];
        while (!check(this.TOKEN.PUNCTUATION, ']')) {
          elements.push(parseExpression());
          if (!check(this.TOKEN.PUNCTUATION, ']')) expect(this.TOKEN.PUNCTUATION, ',');
        }
        expect(this.TOKEN.PUNCTUATION, ']');
        return { type: 'ArrayLiteral', elements };
      }

      throw new Error(`Unexpected token: ${token.type} ${token.value}`);
    };

    const parseStatement = () => {
      const token = peek();

      // Variable declaration
      if (check(this.TOKEN.KEYWORD, 'let') || check(this.TOKEN.KEYWORD, 'const')) {
        const kind = advance().value;
        const name = expect(this.TOKEN.IDENTIFIER).value;
        let init = null;
        if (check(this.TOKEN.OPERATOR, '=')) {
          advance();
          init = parseExpression();
        }
        expect(this.TOKEN.PUNCTUATION, ';');
        return { type: 'VarDecl', kind, name, init };
      }

      // If statement
      if (check(this.TOKEN.KEYWORD, 'if')) {
        advance();
        expect(this.TOKEN.PUNCTUATION, '(');
        const test = parseExpression();
        expect(this.TOKEN.PUNCTUATION, ')');
        const consequent = parseStatement();
        let alternate = null;
        if (check(this.TOKEN.KEYWORD, 'else')) {
          advance();
          alternate = parseStatement();
        }
        return { type: 'IfStatement', test, consequent, alternate };
      }

      // While loop
      if (check(this.TOKEN.KEYWORD, 'while')) {
        advance();
        expect(this.TOKEN.PUNCTUATION, '(');
        const test = parseExpression();
        expect(this.TOKEN.PUNCTUATION, ')');
        const body = parseStatement();
        return { type: 'WhileStatement', test, body };
      }

      // For loop
      if (check(this.TOKEN.KEYWORD, 'for')) {
        advance();
        expect(this.TOKEN.PUNCTUATION, '(');
        const init = !check(this.TOKEN.PUNCTUATION, ';') ? parseStatement() : (advance(), null);
        const test = !check(this.TOKEN.PUNCTUATION, ';') ? parseExpression() : null;
        expect(this.TOKEN.PUNCTUATION, ';');
        const update = !check(this.TOKEN.PUNCTUATION, ')') ? parseExpression() : null;
        expect(this.TOKEN.PUNCTUATION, ')');
        const body = parseStatement();
        return { type: 'ForStatement', init, test, update, body };
      }

      // Function declaration
      if (check(this.TOKEN.KEYWORD, 'function')) {
        advance();
        const name = expect(this.TOKEN.IDENTIFIER).value;
        expect(this.TOKEN.PUNCTUATION, '(');
        const params = [];
        while (!check(this.TOKEN.PUNCTUATION, ')')) {
          params.push(expect(this.TOKEN.IDENTIFIER).value);
          if (!check(this.TOKEN.PUNCTUATION, ')')) expect(this.TOKEN.PUNCTUATION, ',');
        }
        expect(this.TOKEN.PUNCTUATION, ')');
        const body = parseBlock();
        return { type: 'FunctionDecl', name, params, body };
      }

      // Return statement
      if (check(this.TOKEN.KEYWORD, 'return')) {
        advance();
        const value = !check(this.TOKEN.PUNCTUATION, ';') ? parseExpression() : null;
        expect(this.TOKEN.PUNCTUATION, ';');
        return { type: 'ReturnStatement', value };
      }

      // Print statement
      if (check(this.TOKEN.KEYWORD, 'print')) {
        advance();
        expect(this.TOKEN.PUNCTUATION, '(');
        const value = parseExpression();
        expect(this.TOKEN.PUNCTUATION, ')');
        expect(this.TOKEN.PUNCTUATION, ';');
        return { type: 'PrintStatement', value };
      }

      // Block statement
      if (check(this.TOKEN.PUNCTUATION, '{')) {
        return parseBlock();
      }

      // Expression statement
      const expr = parseExpression();

      // Assignment
      if (check(this.TOKEN.OPERATOR, '=')) {
        advance();
        const value = parseExpression();
        expect(this.TOKEN.PUNCTUATION, ';');
        return { type: 'Assignment', target: expr, value };
      }

      expect(this.TOKEN.PUNCTUATION, ';');
      return { type: 'ExpressionStatement', expression: expr };
    };

    const parseBlock = () => {
      expect(this.TOKEN.PUNCTUATION, '{');
      const body = [];
      while (!check(this.TOKEN.PUNCTUATION, '}')) {
        body.push(parseStatement());
      }
      expect(this.TOKEN.PUNCTUATION, '}');
      return { type: 'Block', body };
    };

    const program = { type: 'Program', body: [] };
    while (!check(this.TOKEN.EOF)) {
      program.body.push(parseStatement());
    }

    return program;
  },

  // ============================================
  // COMPILER (AST -> Bytecode)
  // ============================================

  compile(ast) {
    const bytecode = [];
    const constants = [];
    const functions = new Map();
    const globals = new Map();
    let labelCount = 0;

    const emit = (op, ...args) => {
      bytecode.push({ op, args });
    };

    const addConstant = (value) => {
      const idx = constants.indexOf(value);
      if (idx >= 0) return idx;
      constants.push(value);
      return constants.length - 1;
    };

    const newLabel = () => labelCount++;

    const compileNode = (node, scope = { vars: new Map(), parent: null }) => {
      switch (node.type) {
        case 'Program':
          for (const stmt of node.body) compileNode(stmt, scope);
          emit(this.OP.HALT);
          break;

        case 'Block':
          const blockScope = { vars: new Map(), parent: scope };
          for (const stmt of node.body) compileNode(stmt, blockScope);
          break;

        case 'VarDecl':
          if (node.init) {
            compileNode(node.init, scope);
          } else {
            emit(this.OP.PUSH, addConstant(null));
          }
          scope.vars.set(node.name, scope.vars.size);
          emit(this.OP.STORE, scope.vars.get(node.name));
          break;

        case 'Assignment':
          compileNode(node.value, scope);
          if (node.target.type === 'Identifier') {
            const varIdx = resolveVar(node.target.name, scope);
            emit(this.OP.STORE, varIdx);
          } else if (node.target.type === 'IndexExpr') {
            compileNode(node.target.object, scope);
            compileNode(node.target.index, scope);
            emit(this.OP.ARRAY_SET);
          }
          break;

        case 'IfStatement': {
          compileNode(node.test, scope);
          const elseLabel = newLabel();
          const endLabel = newLabel();
          emit(this.OP.JZ, elseLabel);
          compileNode(node.consequent, scope);
          emit(this.OP.JMP, endLabel);
          emit('LABEL', elseLabel);
          if (node.alternate) compileNode(node.alternate, scope);
          emit('LABEL', endLabel);
          break;
        }

        case 'WhileStatement': {
          const startLabel = newLabel();
          const endLabel = newLabel();
          emit('LABEL', startLabel);
          compileNode(node.test, scope);
          emit(this.OP.JZ, endLabel);
          compileNode(node.body, scope);
          emit(this.OP.JMP, startLabel);
          emit('LABEL', endLabel);
          break;
        }

        case 'ForStatement': {
          const forScope = { vars: new Map(), parent: scope };
          if (node.init) compileNode(node.init, forScope);
          const startLabel = newLabel();
          const endLabel = newLabel();
          emit('LABEL', startLabel);
          if (node.test) {
            compileNode(node.test, forScope);
            emit(this.OP.JZ, endLabel);
          }
          compileNode(node.body, forScope);
          if (node.update) {
            compileNode(node.update, forScope);
            emit(this.OP.POP);
          }
          emit(this.OP.JMP, startLabel);
          emit('LABEL', endLabel);
          break;
        }

        case 'FunctionDecl':
          functions.set(node.name, { params: node.params, body: node.body });
          globals.set(node.name, addConstant({ type: 'function', name: node.name }));
          break;

        case 'ReturnStatement':
          if (node.value) compileNode(node.value, scope);
          else emit(this.OP.PUSH, addConstant(null));
          emit(this.OP.RET);
          break;

        case 'PrintStatement':
          compileNode(node.value, scope);
          emit(this.OP.PRINT);
          break;

        case 'ExpressionStatement':
          compileNode(node.expression, scope);
          emit(this.OP.POP);
          break;

        case 'BinaryExpr':
          compileNode(node.left, scope);
          compileNode(node.right, scope);
          const opMap = {
            '+': this.OP.ADD, '-': this.OP.SUB, '*': this.OP.MUL, '/': this.OP.DIV, '%': this.OP.MOD,
            '==': this.OP.EQ, '!=': this.OP.NEQ, '<': this.OP.LT, '<=': this.OP.LTE, '>': this.OP.GT, '>=': this.OP.GTE,
            '&&': this.OP.AND, '||': this.OP.OR
          };
          emit(opMap[node.op]);
          break;

        case 'UnaryExpr':
          compileNode(node.operand, scope);
          if (node.op === '-') emit(this.OP.NEG);
          else if (node.op === '!') emit(this.OP.NOT);
          break;

        case 'CallExpr':
          for (const arg of node.args) compileNode(arg, scope);
          if (node.callee.type === 'Identifier') {
            emit(this.OP.CALL, node.callee.name, node.args.length);
          }
          break;

        case 'IndexExpr':
          compileNode(node.object, scope);
          compileNode(node.index, scope);
          emit(this.OP.ARRAY_GET);
          break;

        case 'Identifier': {
          const varIdx = resolveVar(node.name, scope);
          if (varIdx !== null) {
            emit(this.OP.LOAD, varIdx);
          } else if (globals.has(node.name)) {
            emit(this.OP.LOAD_GLOBAL, globals.get(node.name));
          } else {
            throw new Error(`Undefined variable: ${node.name}`);
          }
          break;
        }

        case 'NumberLiteral':
        case 'StringLiteral':
        case 'BooleanLiteral':
          emit(this.OP.PUSH, addConstant(node.value));
          break;

        case 'NullLiteral':
          emit(this.OP.PUSH, addConstant(null));
          break;

        case 'ArrayLiteral':
          for (const el of node.elements) compileNode(el, scope);
          emit(this.OP.NEW_ARRAY, node.elements.length);
          break;
      }
    };

    const resolveVar = (name, scope) => {
      if (scope.vars.has(name)) return scope.vars.get(name);
      if (scope.parent) return resolveVar(name, scope.parent);
      return null;
    };

    compileNode(ast);

    // Resolve labels to addresses
    const labels = new Map();
    let addr = 0;
    for (const instr of bytecode) {
      if (instr.op === 'LABEL') {
        labels.set(instr.args[0], addr);
      } else {
        addr++;
      }
    }

    const finalBytecode = bytecode
      .filter(i => i.op !== 'LABEL')
      .map(i => {
        if (i.op === this.OP.JMP || i.op === this.OP.JZ || i.op === this.OP.JNZ) {
          return { op: i.op, args: [labels.get(i.args[0])] };
        }
        return i;
      });

    return { bytecode: finalBytecode, constants, functions };
  },

  // ============================================
  // INTERPRETER
  // ============================================

  createVM() {
    return {
      stack: [],
      callStack: [],
      memory: {},
      globals: {},
      output: [],
      ip: 0,
      running: false
    };
  },

  run(compiled, vm = this.createVM()) {
    const { bytecode, constants, functions } = compiled;
    vm.running = true;
    vm.ip = 0;

    const push = (v) => vm.stack.push(v);
    const pop = () => vm.stack.pop();
    const peek = () => vm.stack[vm.stack.length - 1];

    while (vm.running && vm.ip < bytecode.length) {
      const instr = bytecode[vm.ip];
      const op = instr.op;
      const args = instr.args || [];

      switch (op) {
        case this.OP.NOP: break;
        case this.OP.PUSH: push(constants[args[0]]); break;
        case this.OP.POP: pop(); break;
        case this.OP.DUP: push(peek()); break;
        case this.OP.SWAP: { const a = pop(), b = pop(); push(a); push(b); break; }

        case this.OP.ADD: { const b = pop(), a = pop(); push(a + b); break; }
        case this.OP.SUB: { const b = pop(), a = pop(); push(a - b); break; }
        case this.OP.MUL: { const b = pop(), a = pop(); push(a * b); break; }
        case this.OP.DIV: { const b = pop(), a = pop(); push(a / b); break; }
        case this.OP.MOD: { const b = pop(), a = pop(); push(a % b); break; }
        case this.OP.NEG: push(-pop()); break;

        case this.OP.EQ: { const b = pop(), a = pop(); push(a === b); break; }
        case this.OP.NEQ: { const b = pop(), a = pop(); push(a !== b); break; }
        case this.OP.LT: { const b = pop(), a = pop(); push(a < b); break; }
        case this.OP.LTE: { const b = pop(), a = pop(); push(a <= b); break; }
        case this.OP.GT: { const b = pop(), a = pop(); push(a > b); break; }
        case this.OP.GTE: { const b = pop(), a = pop(); push(a >= b); break; }

        case this.OP.AND: { const b = pop(), a = pop(); push(a && b); break; }
        case this.OP.OR: { const b = pop(), a = pop(); push(a || b); break; }
        case this.OP.NOT: push(!pop()); break;

        case this.OP.LOAD: push(vm.memory[args[0]]); break;
        case this.OP.STORE: vm.memory[args[0]] = pop(); break;
        case this.OP.LOAD_GLOBAL: push(vm.globals[args[0]]); break;
        case this.OP.STORE_GLOBAL: vm.globals[args[0]] = pop(); break;

        case this.OP.JMP: vm.ip = args[0] - 1; break;
        case this.OP.JZ: if (!pop()) vm.ip = args[0] - 1; break;
        case this.OP.JNZ: if (pop()) vm.ip = args[0] - 1; break;

        case this.OP.CALL: {
          const funcName = args[0];
          const argCount = args[1];
          const func = functions.get(funcName);
          if (func) {
            vm.callStack.push({ ip: vm.ip, memory: { ...vm.memory } });
            vm.memory = {};
            for (let i = argCount - 1; i >= 0; i--) {
              vm.memory[i] = pop();
            }
            // TODO: Implement function body execution
          }
          break;
        }

        case this.OP.RET: {
          const retVal = pop();
          const frame = vm.callStack.pop();
          if (frame) {
            vm.ip = frame.ip;
            vm.memory = frame.memory;
          }
          push(retVal);
          break;
        }

        case this.OP.NEW_ARRAY: {
          const len = args[0];
          const arr = [];
          for (let i = 0; i < len; i++) arr.unshift(pop());
          push(arr);
          break;
        }
        case this.OP.ARRAY_GET: { const idx = pop(), arr = pop(); push(arr[idx]); break; }
        case this.OP.ARRAY_SET: { const idx = pop(), arr = pop(), val = pop(); arr[idx] = val; break; }
        case this.OP.ARRAY_LEN: push(pop().length); break;

        case this.OP.PRINT: vm.output.push(pop()); break;
        case this.OP.HALT: vm.running = false; break;
      }

      vm.ip++;
    }

    return vm;
  },

  // Convenience method: compile and run
  execute(source) {
    const tokens = this.tokenize(source);
    const ast = this.parse(tokens);
    const compiled = this.compile(ast);
    const vm = this.run(compiled);
    return vm.output;
  }
};
