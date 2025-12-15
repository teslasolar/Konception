// ============================================
// KONOMI KONCEPTION - B+Tree Database
// Pure JavaScript - Zero Dependencies
// ============================================

class BTreeNode {
  constructor(order, isLeaf = false) {
    this.order = order;
    this.isLeaf = isLeaf;
    this.keys = [];
    this.values = [];     // Only for leaf nodes
    this.children = [];   // Only for internal nodes
    this.next = null;     // For leaf node linking (range queries)
    this.parent = null;
  }

  get isFull() {
    return this.keys.length >= this.order - 1;
  }

  get isMinimal() {
    return this.keys.length <= Math.floor((this.order - 1) / 2);
  }
}

class KonomiBTree {
  constructor(order = 4) {
    this.order = Math.max(3, order);
    this.root = new BTreeNode(this.order, true);
    this.size = 0;
  }

  // ============================================
  // SEARCH OPERATIONS
  // ============================================

  search(key) {
    return this._search(this.root, key);
  }

  _search(node, key) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;

    if (node.isLeaf) {
      if (i < node.keys.length && node.keys[i] === key) {
        return node.values[i];
      }
      return null;
    }

    if (i < node.keys.length && key === node.keys[i]) i++;
    return this._search(node.children[i], key);
  }

  has(key) {
    return this.search(key) !== null;
  }

  // ============================================
  // RANGE QUERIES
  // ============================================

  range(startKey, endKey) {
    const results = [];
    let leaf = this._findLeaf(this.root, startKey);

    while (leaf) {
      for (let i = 0; i < leaf.keys.length; i++) {
        if (leaf.keys[i] >= startKey && leaf.keys[i] <= endKey) {
          results.push({ key: leaf.keys[i], value: leaf.values[i] });
        }
        if (leaf.keys[i] > endKey) return results;
      }
      leaf = leaf.next;
    }

    return results;
  }

  _findLeaf(node, key) {
    if (node.isLeaf) return node;

    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) i++;
    return this._findLeaf(node.children[i], key);
  }

  // Get all entries
  getAll() {
    const results = [];
    let leaf = this._getFirstLeaf();

    while (leaf) {
      for (let i = 0; i < leaf.keys.length; i++) {
        results.push({ key: leaf.keys[i], value: leaf.values[i] });
      }
      leaf = leaf.next;
    }

    return results;
  }

  _getFirstLeaf() {
    let node = this.root;
    while (!node.isLeaf) {
      node = node.children[0];
    }
    return node;
  }

  // ============================================
  // INSERT OPERATIONS
  // ============================================

  insert(key, value) {
    const root = this.root;

    if (root.isFull) {
      const newRoot = new BTreeNode(this.order, false);
      newRoot.children.push(this.root);
      this.root.parent = newRoot;
      this._splitChild(newRoot, 0);
      this.root = newRoot;
    }

    this._insertNonFull(this.root, key, value);
    this.size++;
  }

  _insertNonFull(node, key, value) {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // Find position and insert
      while (i >= 0 && key < node.keys[i]) i--;

      // Check for duplicate key (update value)
      if (i >= 0 && node.keys[i] === key) {
        node.values[i] = value;
        this.size--; // Didn't actually add new entry
        return;
      }

      node.keys.splice(i + 1, 0, key);
      node.values.splice(i + 1, 0, value);
    } else {
      // Find child to descend into
      while (i >= 0 && key < node.keys[i]) i--;
      i++;

      if (node.children[i].isFull) {
        this._splitChild(node, i);
        if (key > node.keys[i]) i++;
      }

      this._insertNonFull(node.children[i], key, value);
    }
  }

  _splitChild(parent, index) {
    const fullChild = parent.children[index];
    const mid = Math.floor((this.order - 1) / 2);

    const newChild = new BTreeNode(this.order, fullChild.isLeaf);
    newChild.parent = parent;

    if (fullChild.isLeaf) {
      // Split leaf node
      newChild.keys = fullChild.keys.splice(mid);
      newChild.values = fullChild.values.splice(mid);

      // Maintain leaf linking
      newChild.next = fullChild.next;
      fullChild.next = newChild;

      // Promote copy of first key of new node
      parent.keys.splice(index, 0, newChild.keys[0]);
    } else {
      // Split internal node
      const midKey = fullChild.keys[mid];
      newChild.keys = fullChild.keys.splice(mid + 1);
      fullChild.keys.pop(); // Remove the middle key

      newChild.children = fullChild.children.splice(mid + 1);
      newChild.children.forEach(c => c.parent = newChild);

      parent.keys.splice(index, 0, midKey);
    }

    parent.children.splice(index + 1, 0, newChild);
  }

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  delete(key) {
    if (!this._delete(this.root, key)) return false;

    // If root is empty and has children, make first child the new root
    if (this.root.keys.length === 0 && !this.root.isLeaf) {
      this.root = this.root.children[0];
      this.root.parent = null;
    }

    this.size--;
    return true;
  }

  _delete(node, key) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;

    if (node.isLeaf) {
      if (i < node.keys.length && node.keys[i] === key) {
        node.keys.splice(i, 1);
        node.values.splice(i, 1);
        return true;
      }
      return false;
    }

    // Internal node
    if (i < node.keys.length && node.keys[i] === key) {
      // Key found in internal node
      return this._deleteInternalNode(node, key, i);
    }

    // Key might be in child
    const child = node.children[i];

    // Ensure child has enough keys
    if (child.keys.length <= Math.floor((this.order - 1) / 2)) {
      this._fillChild(node, i);
    }

    // Recalculate index after potential merge
    if (i > node.keys.length) {
      return this._delete(node.children[i - 1], key);
    }
    return this._delete(node.children[i], key);
  }

  _deleteInternalNode(node, key, index) {
    const leftChild = node.children[index];
    const rightChild = node.children[index + 1];

    if (leftChild.keys.length > Math.floor((this.order - 1) / 2)) {
      // Get predecessor
      const pred = this._getPredecessor(leftChild);
      node.keys[index] = pred.key;
      return this._delete(leftChild, pred.key);
    } else if (rightChild.keys.length > Math.floor((this.order - 1) / 2)) {
      // Get successor
      const succ = this._getSuccessor(rightChild);
      node.keys[index] = succ.key;
      return this._delete(rightChild, succ.key);
    } else {
      // Merge children
      this._merge(node, index);
      return this._delete(leftChild, key);
    }
  }

  _getPredecessor(node) {
    while (!node.isLeaf) {
      node = node.children[node.children.length - 1];
    }
    const i = node.keys.length - 1;
    return { key: node.keys[i], value: node.values[i] };
  }

  _getSuccessor(node) {
    while (!node.isLeaf) {
      node = node.children[0];
    }
    return { key: node.keys[0], value: node.values[0] };
  }

  _fillChild(node, index) {
    if (index > 0 && node.children[index - 1].keys.length > Math.floor((this.order - 1) / 2)) {
      this._borrowFromLeft(node, index);
    } else if (index < node.children.length - 1 && node.children[index + 1].keys.length > Math.floor((this.order - 1) / 2)) {
      this._borrowFromRight(node, index);
    } else {
      if (index < node.children.length - 1) {
        this._merge(node, index);
      } else {
        this._merge(node, index - 1);
      }
    }
  }

  _borrowFromLeft(node, index) {
    const child = node.children[index];
    const leftSibling = node.children[index - 1];

    if (child.isLeaf) {
      child.keys.unshift(leftSibling.keys.pop());
      child.values.unshift(leftSibling.values.pop());
      node.keys[index - 1] = child.keys[0];
    } else {
      child.keys.unshift(node.keys[index - 1]);
      node.keys[index - 1] = leftSibling.keys.pop();
      child.children.unshift(leftSibling.children.pop());
      child.children[0].parent = child;
    }
  }

  _borrowFromRight(node, index) {
    const child = node.children[index];
    const rightSibling = node.children[index + 1];

    if (child.isLeaf) {
      child.keys.push(rightSibling.keys.shift());
      child.values.push(rightSibling.values.shift());
      node.keys[index] = rightSibling.keys[0];
    } else {
      child.keys.push(node.keys[index]);
      node.keys[index] = rightSibling.keys.shift();
      child.children.push(rightSibling.children.shift());
      child.children[child.children.length - 1].parent = child;
    }
  }

  _merge(node, index) {
    const leftChild = node.children[index];
    const rightChild = node.children[index + 1];

    if (leftChild.isLeaf) {
      leftChild.keys = leftChild.keys.concat(rightChild.keys);
      leftChild.values = leftChild.values.concat(rightChild.values);
      leftChild.next = rightChild.next;
    } else {
      leftChild.keys.push(node.keys[index]);
      leftChild.keys = leftChild.keys.concat(rightChild.keys);
      leftChild.children = leftChild.children.concat(rightChild.children);
      rightChild.children.forEach(c => c.parent = leftChild);
    }

    node.keys.splice(index, 1);
    node.children.splice(index + 1, 1);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  clear() {
    this.root = new BTreeNode(this.order, true);
    this.size = 0;
  }

  get length() {
    return this.size;
  }

  // Iterator
  *[Symbol.iterator]() {
    let leaf = this._getFirstLeaf();
    while (leaf) {
      for (let i = 0; i < leaf.keys.length; i++) {
        yield { key: leaf.keys[i], value: leaf.values[i] };
      }
      leaf = leaf.next;
    }
  }

  // Serialize to JSON
  toJSON() {
    return {
      order: this.order,
      size: this.size,
      data: this.getAll()
    };
  }

  // Restore from JSON
  static fromJSON(json) {
    const tree = new KonomiBTree(json.order);
    for (const { key, value } of json.data) {
      tree.insert(key, value);
    }
    return tree;
  }
}

// ============================================
// KONOMI DATABASE - Higher-level API
// ============================================

const KonomiDB = {
  collections: new Map(),
  indices: new Map(),

  // Create or get collection
  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new KonomiBTree(32));
      this.indices.set(name, new Map());
    }
    return {
      name,
      _tree: this.collections.get(name),
      _indices: this.indices.get(name),

      // Insert document
      insert(doc) {
        const id = doc._id || KonomiUtils.uuid();
        doc._id = id;
        doc._created = KonomiUtils.now();
        this._tree.insert(id, doc);

        // Update indices
        for (const [field, index] of this._indices) {
          if (doc[field] !== undefined) {
            const existing = index.search(doc[field]) || [];
            existing.push(id);
            index.insert(doc[field], existing);
          }
        }

        return doc;
      },

      // Find by ID
      findById(id) {
        return this._tree.search(id);
      },

      // Find all matching documents
      find(query = {}) {
        const results = [];
        for (const { value: doc } of this._tree) {
          if (this._matches(doc, query)) {
            results.push(doc);
          }
        }
        return results;
      },

      // Find one matching document
      findOne(query = {}) {
        for (const { value: doc } of this._tree) {
          if (this._matches(doc, query)) {
            return doc;
          }
        }
        return null;
      },

      // Update document
      update(id, updates) {
        const doc = this._tree.search(id);
        if (!doc) return null;

        Object.assign(doc, updates);
        doc._updated = KonomiUtils.now();
        this._tree.insert(id, doc);
        return doc;
      },

      // Delete document
      delete(id) {
        return this._tree.delete(id);
      },

      // Create index on field
      createIndex(field) {
        if (this._indices.has(field)) return;

        const index = new KonomiBTree(32);
        for (const { value: doc } of this._tree) {
          if (doc[field] !== undefined) {
            const existing = index.search(doc[field]) || [];
            existing.push(doc._id);
            index.insert(doc[field], existing);
          }
        }
        this._indices.set(field, index);
      },

      // Find by indexed field
      findByIndex(field, value) {
        const index = this._indices.get(field);
        if (!index) return this.find({ [field]: value });

        const ids = index.search(value) || [];
        return ids.map(id => this._tree.search(id)).filter(Boolean);
      },

      // Count documents
      count(query = {}) {
        if (Object.keys(query).length === 0) return this._tree.length;
        return this.find(query).length;
      },

      // Check if query matches document
      _matches(doc, query) {
        for (const [key, value] of Object.entries(query)) {
          if (typeof value === 'object' && value !== null) {
            // Handle operators
            for (const [op, opValue] of Object.entries(value)) {
              switch (op) {
                case '$eq': if (doc[key] !== opValue) return false; break;
                case '$ne': if (doc[key] === opValue) return false; break;
                case '$gt': if (doc[key] <= opValue) return false; break;
                case '$gte': if (doc[key] < opValue) return false; break;
                case '$lt': if (doc[key] >= opValue) return false; break;
                case '$lte': if (doc[key] > opValue) return false; break;
                case '$in': if (!opValue.includes(doc[key])) return false; break;
                case '$nin': if (opValue.includes(doc[key])) return false; break;
                case '$regex': if (!new RegExp(opValue).test(doc[key])) return false; break;
              }
            }
          } else {
            if (doc[key] !== value) return false;
          }
        }
        return true;
      },

      // Export collection
      toJSON() {
        return this._tree.toJSON();
      },

      // Clear collection
      clear() {
        this._tree.clear();
        this._indices.clear();
      }
    };
  },

  // Drop collection
  drop(name) {
    this.collections.delete(name);
    this.indices.delete(name);
  },

  // List collections
  list() {
    return Array.from(this.collections.keys());
  },

  // Export all data
  export() {
    const data = {};
    for (const [name, tree] of this.collections) {
      data[name] = tree.toJSON();
    }
    return data;
  },

  // Import data
  import(data) {
    for (const [name, treeData] of Object.entries(data)) {
      this.collections.set(name, KonomiBTree.fromJSON(treeData));
    }
  },

  // Persist to localStorage
  save(key = 'konomi_db') {
    const data = this.export();
    localStorage.setItem(key, JSON.stringify(data));
  },

  // Load from localStorage
  load(key = 'konomi_db') {
    const data = localStorage.getItem(key);
    if (data) {
      this.import(JSON.parse(data));
    }
  }
};
