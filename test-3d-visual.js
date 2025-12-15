// Visual ASCII test for 3D rendering
// Creates a text-based preview of the render

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

const mat4 = {
  identity: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],

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
    return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
  },

  rotationX: (angle) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
  },

  perspective: (fov, aspect, near, far) => {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0];
  },

  lookAt: (eye, center, up) => {
    const z = vec3.normalize(vec3.sub(eye, center));
    const x = vec3.normalize(vec3.cross(up, z));
    const y = vec3.cross(z, x);
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

function createCube(size = 1) {
  const s = size / 2;
  return {
    vertices: [
      [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
      [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
    ],
    faces: [
      [0, 2, 1], [0, 3, 2],
      [4, 5, 6], [4, 6, 7],
      [0, 1, 5], [0, 5, 4],
      [3, 6, 2], [3, 7, 6],
      [0, 4, 7], [0, 7, 3],
      [1, 2, 6], [1, 6, 5]
    ],
    faceNames: ['Back', 'Back', 'Front', 'Front', 'Bottom', 'Bottom', 'Top', 'Top', 'Left', 'Left', 'Right', 'Right']
  };
}

function calculateNormal(v0, v1, v2) {
  const e1 = vec3.sub(v1, v0);
  const e2 = vec3.sub(v2, v0);
  return vec3.normalize(vec3.cross(e1, e2));
}

function project(point, mvp, width, height) {
  const p = mat4.transformPoint(mvp, point);
  return [
    (p[0] + 1) * 0.5 * width,
    (1 - p[1]) * 0.5 * height,
    p[2]
  ];
}

// Simple scanline triangle fill
function fillTriangle(buffer, width, height, p0, p1, p2, char, zBuffer) {
  const verts = [p0, p1, p2].sort((a, b) => a[1] - b[1]);
  const [top, mid, bot] = verts;

  const interpolate = (y, pa, pb) => {
    if (pa[1] === pb[1]) return pa;
    const t = (y - pa[1]) / (pb[1] - pa[1]);
    return [pa[0] + (pb[0] - pa[0]) * t, y, pa[2] + (pb[2] - pa[2]) * t];
  };

  for (let y = Math.max(0, Math.ceil(top[1])); y <= Math.min(height - 1, Math.floor(bot[1])); y++) {
    let left, right;
    if (y < mid[1]) {
      left = interpolate(y, top, mid);
      right = interpolate(y, top, bot);
    } else {
      left = interpolate(y, mid, bot);
      right = interpolate(y, top, bot);
    }
    if (left[0] > right[0]) [left, right] = [right, left];

    for (let x = Math.max(0, Math.ceil(left[0])); x <= Math.min(width - 1, Math.floor(right[0])); x++) {
      const t = left[0] === right[0] ? 0 : (x - left[0]) / (right[0] - left[0]);
      const z = left[2] + (right[2] - left[2]) * t;
      const idx = y * width + x;
      if (z < zBuffer[idx]) {
        zBuffer[idx] = z;
        buffer[idx] = char;
      }
    }
  }
}

function render() {
  const WIDTH = 80;
  const HEIGHT = 30;

  const buffer = new Array(WIDTH * HEIGHT).fill(' ');
  const zBuffer = new Array(WIDTH * HEIGHT).fill(Infinity);

  const camera = {
    position: [0, 0, 4],
    target: [0, 0, 0],
    up: [0, 1, 0],
    fov: Math.PI / 3,  // 60 degree FOV
    near: 0.1,
    far: 100
  };

  const view = mat4.lookAt(camera.position, camera.target, camera.up);
  // Adjust aspect ratio for terminal characters (~2:1 height:width)
  const proj = mat4.perspective(camera.fov, (WIDTH / HEIGHT) * 2, camera.near, camera.far);
  const viewProj = mat4.multiply(proj, view);

  const cube = createCube(1.8);  // Larger cube
  const angle = 0.6;
  const transform = mat4.multiply(mat4.rotationY(angle), mat4.rotationX(angle * 0.7 + 0.4));
  const mvp = mat4.multiply(viewProj, transform);

  const shadeChars = ['@', '#', '%', '=', '+', '-', '.'];

  console.log('\n=== ASCII 3D Cube Render ===\n');

  let faceCount = 0;
  for (let i = 0; i < cube.faces.length; i++) {
    const face = cube.faces[i];
    const v0 = cube.vertices[face[0]];
    const v1 = cube.vertices[face[1]];
    const v2 = cube.vertices[face[2]];

    const w0 = mat4.transformPoint(transform, v0);
    const w1 = mat4.transformPoint(transform, v1);
    const w2 = mat4.transformPoint(transform, v2);

    const worldNormal = calculateNormal(w0, w1, w2);
    const viewDir = vec3.normalize(vec3.sub(camera.position, w0));

    if (vec3.dot(worldNormal, viewDir) > 0) continue;

    const p0 = project(v0, mvp, WIDTH, HEIGHT);
    const p1 = project(v1, mvp, WIDTH, HEIGHT);
    const p2 = project(v2, mvp, WIDTH, HEIGHT);

    if (p0[2] > 1 || p1[2] > 1 || p2[2] > 1) continue;

    const light = vec3.normalize([1, 1, 1]);
    const diffuse = Math.abs(vec3.dot(worldNormal, light));
    const shadeIdx = Math.min(shadeChars.length - 1, Math.floor((1 - diffuse) * shadeChars.length));

    fillTriangle(buffer, WIDTH, HEIGHT, p0, p1, p2, shadeChars[shadeIdx], zBuffer);
    faceCount++;
  }

  // Draw border
  const output = [];
  output.push('┌' + '─'.repeat(WIDTH) + '┐');
  for (let y = 0; y < HEIGHT; y++) {
    let row = '│';
    for (let x = 0; x < WIDTH; x++) {
      row += buffer[y * WIDTH + x];
    }
    row += '│';
    output.push(row);
  }
  output.push('└' + '─'.repeat(WIDTH) + '┘');

  console.log(output.join('\n'));
  console.log(`\nRendered ${faceCount} visible faces`);
  console.log('Canvas size: 80x30 characters (simulating 600x400 pixels scaled down)');

  return faceCount > 0;
}

const success = render();
console.log(success ? '\n✓ 3D rendering working!' : '\n✗ 3D rendering failed!');
process.exit(success ? 0 : 1);
