// Test 3D rendering logic without browser
// This tests the math and rendering pipeline

// Vector operations
const vec3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  cross: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  normalize: (v) => {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
  }
};

// Matrix operations
const mat4 = {
  identity: () => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ],

  // Column-major matrix multiply: C = A * B
  multiply: (a, b) => {
    const result = new Array(16).fill(0);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        for (let k = 0; k < 4; k++) {
          result[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
        }
      }
    }
    return result;
  },

  rotationY: (angle) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  },

  rotationX: (angle) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ];
  },

  perspective: (fov, aspect, near, far) => {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ];
  },

  lookAt: (eye, center, up) => {
    const z = vec3.normalize(vec3.sub(eye, center));
    const x = vec3.normalize(vec3.cross(up, z));
    const y = vec3.cross(z, x);
    // Column-major: col0=x-axis, col1=y-axis, col2=z-axis, col3=translation
    return [
      x[0], x[1], x[2], 0,
      y[0], y[1], y[2], 0,
      z[0], z[1], z[2], 0,
      -vec3.dot(x, eye), -vec3.dot(y, eye), -vec3.dot(z, eye), 1
    ];
  },

  transformPoint: (m, p) => {
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return [
      (m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w,
      (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w,
      (m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]) / w
    ];
  }
};

// Create cube (fixed winding)
function createCube(size = 1) {
  const s = size / 2;
  return {
    vertices: [
      [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],  // 0-3: back face
      [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]       // 4-7: front face
    ],
    faces: [
      // CCW winding when viewed from outside
      [0, 2, 1], [0, 3, 2], // Back (facing -Z)
      [4, 5, 6], [4, 6, 7], // Front (facing +Z)
      [0, 1, 5], [0, 5, 4], // Bottom (facing -Y)
      [3, 6, 2], [3, 7, 6], // Top (facing +Y)
      [0, 4, 7], [0, 7, 3], // Left (facing -X)
      [1, 2, 6], [1, 6, 5]  // Right (facing +X)
    ],
    color: [100, 150, 200]
  };
}

// Calculate face normal
function calculateNormal(v0, v1, v2) {
  const e1 = vec3.sub(v1, v0);
  const e2 = vec3.sub(v2, v0);
  return vec3.normalize(vec3.cross(e1, e2));
}

// Project to screen coordinates
function project(point, mvp, width, height) {
  const p = mat4.transformPoint(mvp, point);
  return [
    (p[0] + 1) * 0.5 * width,
    (1 - p[1]) * 0.5 * height,
    p[2]
  ];
}

// Test rendering
function testRendering() {
  console.log('=== 3D Rendering Test ===\n');

  const width = 600;
  const height = 400;

  // Camera setup
  const camera = {
    position: [0, 0, 5],
    target: [0, 0, 0],
    up: [0, 1, 0],
    fov: Math.PI / 4,
    near: 0.1,
    far: 100
  };

  // Create view-projection matrix
  const view = mat4.lookAt(camera.position, camera.target, camera.up);
  const proj = mat4.perspective(camera.fov, width / height, camera.near, camera.far);
  const viewProj = mat4.multiply(proj, view);

  // Create cube and transformation
  const cube = createCube(1);
  const angle = 0.5; // Some rotation
  const transform = mat4.multiply(
    mat4.rotationY(angle),
    mat4.rotationX(angle * 0.5)
  );

  const mvp = mat4.multiply(viewProj, transform);

  console.log('Camera position:', camera.position);
  console.log('Cube vertices:', cube.vertices.length);
  console.log('Cube faces:', cube.faces.length);
  console.log('Rotation angle:', angle.toFixed(2), 'rad\n');

  let visibleFaces = 0;
  let culledFaces = 0;
  let clippedFaces = 0;
  let drawnFaces = 0;

  for (let i = 0; i < cube.faces.length; i++) {
    const face = cube.faces[i];

    // Get vertices
    const v0 = cube.vertices[face[0]];
    const v1 = cube.vertices[face[1]];
    const v2 = cube.vertices[face[2]];

    // Transform vertices to world space
    const w0 = mat4.transformPoint(transform, v0);
    const w1 = mat4.transformPoint(transform, v1);
    const w2 = mat4.transformPoint(transform, v2);

    // Calculate normal in world space
    const worldNormal = calculateNormal(w0, w1, w2);

    // Backface culling
    const viewDir = vec3.normalize(vec3.sub(camera.position, w0));
    const dotProduct = vec3.dot(worldNormal, viewDir);

    if (dotProduct > 0) {
      culledFaces++;
      continue;
    }
    visibleFaces++;

    // Project vertices
    const p0 = project(v0, mvp, width, height);
    const p1 = project(v1, mvp, width, height);
    const p2 = project(v2, mvp, width, height);

    // Debug Z values
    console.log(`Face ${i}: Z values: p0=${p0[2].toFixed(3)}, p1=${p1[2].toFixed(3)}, p2=${p2[2].toFixed(3)}`);

    // Clip against near plane - the perspective projection produces z in range [-1, 1]
    // Objects in front of camera have z < 0 in NDC for this projection
    // We should clip when z > 1 (behind far plane) or check differently
    // Actually for this projection, visible z should be in [-1, 0] range
    if (p0[2] > 1 || p1[2] > 1 || p2[2] > 1) {
      clippedFaces++;
      continue;
    }

    drawnFaces++;

    // Check if projected points are on screen
    const onScreen = (p) => p[0] >= 0 && p[0] < width && p[1] >= 0 && p[1] < height;

    console.log(`Face ${i}: vertices [${face.join(',')}]`);
    console.log(`  World center: [${((w0[0]+w1[0]+w2[0])/3).toFixed(2)}, ${((w0[1]+w1[1]+w2[1])/3).toFixed(2)}, ${((w0[2]+w1[2]+w2[2])/3).toFixed(2)}]`);
    console.log(`  Normal: [${worldNormal.map(n => n.toFixed(2)).join(', ')}]`);
    console.log(`  View dot: ${dotProduct.toFixed(3)} (visible: facing camera)`);
    console.log(`  Projected p0: [${p0[0].toFixed(1)}, ${p0[1].toFixed(1)}, z=${p0[2].toFixed(3)}] ${onScreen(p0) ? 'ON SCREEN' : 'off screen'}`);
    console.log(`  Projected p1: [${p1[0].toFixed(1)}, ${p1[1].toFixed(1)}, z=${p1[2].toFixed(3)}] ${onScreen(p1) ? 'ON SCREEN' : 'off screen'}`);
    console.log(`  Projected p2: [${p2[0].toFixed(1)}, ${p2[1].toFixed(1)}, z=${p2[2].toFixed(3)}] ${onScreen(p2) ? 'ON SCREEN' : 'off screen'}`);
    console.log('');
  }

  console.log('=== Summary ===');
  console.log(`Total faces: ${cube.faces.length}`);
  console.log(`Backface culled: ${culledFaces}`);
  console.log(`Passed culling: ${visibleFaces}`);
  console.log(`Near-plane clipped: ${clippedFaces}`);
  console.log(`Actually drawn: ${drawnFaces}`);

  if (drawnFaces > 0) {
    console.log('\n SUCCESS: 3D rendering should work! Faces are being drawn.');
    return true;
  } else {
    console.log('\n FAILURE: No faces are being drawn!');
    return false;
  }
}

// Run test
const result = testRendering();
process.exit(result ? 0 : 1);
