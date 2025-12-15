// ============================================
// KONOMI KONCEPTION - 2D/3D Graphics Renderer
// Pure JavaScript Canvas - Zero Dependencies
// ============================================

const KonomiRenderer = {
  // ============================================
  // 2D RENDERER
  // ============================================

  create2D(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    return {
      canvas,
      ctx,
      width,
      height,

      // Clear canvas
      clear(color = '#000000') {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
      },

      // Basic shapes
      rect(x, y, w, h, options = {}) {
        const { fill = '#ffffff', stroke = null, lineWidth = 1 } = options;
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fillRect(x, y, w, h);
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lineWidth;
          ctx.strokeRect(x, y, w, h);
        }
      },

      circle(x, y, r, options = {}) {
        const { fill = '#ffffff', stroke = null, lineWidth = 1 } = options;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      },

      line(x1, y1, x2, y2, options = {}) {
        const { color = '#ffffff', lineWidth = 1 } = options;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      },

      polygon(points, options = {}) {
        const { fill = '#ffffff', stroke = null, lineWidth = 1 } = options;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      },

      text(str, x, y, options = {}) {
        const { font = '14px monospace', fill = '#ffffff', align = 'left', baseline = 'top' } = options;
        ctx.font = font;
        ctx.fillStyle = fill;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.fillText(str, x, y);
      },

      // Transformations
      save() { ctx.save(); },
      restore() { ctx.restore(); },
      translate(x, y) { ctx.translate(x, y); },
      rotate(angle) { ctx.rotate(angle); },
      scale(x, y) { ctx.scale(x, y); },

      // Image operations
      drawImage(img, x, y, w, h) {
        ctx.drawImage(img, x, y, w || img.width, h || img.height);
      },

      getImageData(x, y, w, h) {
        return ctx.getImageData(x || 0, y || 0, w || width, h || height);
      },

      putImageData(data, x, y) {
        ctx.putImageData(data, x || 0, y || 0);
      },

      // Gradient
      linearGradient(x1, y1, x2, y2, stops) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        for (const [offset, color] of stops) {
          gradient.addColorStop(offset, color);
        }
        return gradient;
      },

      radialGradient(x1, y1, r1, x2, y2, r2, stops) {
        const gradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
        for (const [offset, color] of stops) {
          gradient.addColorStop(offset, color);
        }
        return gradient;
      },

      // Export
      toDataURL(type = 'image/png') {
        return canvas.toDataURL(type);
      },

      toBlob(callback, type = 'image/png') {
        canvas.toBlob(callback, type);
      }
    };
  },

  // ============================================
  // 3D MATH UTILITIES
  // ============================================

  vec3: {
    create(x = 0, y = 0, z = 0) { return [x, y, z]; },
    add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; },
    sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; },
    scale(v, s) { return [v[0] * s, v[1] * s, v[2] * s]; },
    dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
    cross(a, b) {
      return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
      ];
    },
    length(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]); },
    normalize(v) {
      const len = this.length(v);
      return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
    }
  },

  mat4: {
    identity() {
      return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ];
    },

    multiply(a, b) {
      const result = new Array(16);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          result[i * 4 + j] =
            a[i * 4 + 0] * b[0 * 4 + j] +
            a[i * 4 + 1] * b[1 * 4 + j] +
            a[i * 4 + 2] * b[2 * 4 + j] +
            a[i * 4 + 3] * b[3 * 4 + j];
        }
      }
      return result;
    },

    translation(x, y, z) {
      return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
      ];
    },

    rotationX(angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
      ];
    },

    rotationY(angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
      ];
    },

    rotationZ(angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ];
    },

    scaling(x, y, z) {
      return [
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
      ];
    },

    perspective(fov, aspect, near, far) {
      const f = 1 / Math.tan(fov / 2);
      const nf = 1 / (near - far);
      return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
      ];
    },

    lookAt(eye, center, up) {
      const z = KonomiRenderer.vec3.normalize(KonomiRenderer.vec3.sub(eye, center));
      const x = KonomiRenderer.vec3.normalize(KonomiRenderer.vec3.cross(up, z));
      const y = KonomiRenderer.vec3.cross(z, x);
      return [
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -KonomiRenderer.vec3.dot(x, eye), -KonomiRenderer.vec3.dot(y, eye), -KonomiRenderer.vec3.dot(z, eye), 1
      ];
    },

    transformPoint(m, p) {
      const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      return [
        (m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w,
        (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w,
        (m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]) / w
      ];
    }
  },

  // ============================================
  // 3D RENDERER (Software Rasterizer)
  // ============================================

  create3D(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Z-buffer
    let zBuffer = new Float32Array(width * height);

    // Frame buffer
    let frameBuffer = ctx.createImageData(width, height);

    const renderer = {
      canvas,
      ctx,
      width,
      height,

      // Camera
      camera: {
        position: [0, 0, 5],
        target: [0, 0, 0],
        up: [0, 1, 0],
        fov: Math.PI / 4,
        near: 0.1,
        far: 100
      },

      // Lighting
      light: {
        direction: KonomiRenderer.vec3.normalize([1, 1, 1]),
        ambient: 0.2,
        diffuse: 0.8
      },

      // Clear buffers
      clear(color = [0, 0, 0]) {
        zBuffer.fill(Infinity);
        const data = frameBuffer.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = color[0];
          data[i + 1] = color[1];
          data[i + 2] = color[2];
          data[i + 3] = 255;
        }
      },

      // Present frame buffer
      present() {
        ctx.putImageData(frameBuffer, 0, 0);
      },

      // Get view-projection matrix
      getViewProjection() {
        const view = KonomiRenderer.mat4.lookAt(
          this.camera.position,
          this.camera.target,
          this.camera.up
        );
        const proj = KonomiRenderer.mat4.perspective(
          this.camera.fov,
          width / height,
          this.camera.near,
          this.camera.far
        );
        return KonomiRenderer.mat4.multiply(proj, view);
      },

      // Project 3D point to 2D screen
      project(point, mvp) {
        const p = KonomiRenderer.mat4.transformPoint(mvp, point);
        return [
          (p[0] + 1) * 0.5 * width,
          (1 - p[1]) * 0.5 * height,
          p[2]
        ];
      },

      // Set pixel with z-buffer test
      setPixel(x, y, z, color) {
        x = Math.round(x);
        y = Math.round(y);
        if (x < 0 || x >= width || y < 0 || y >= height) return;

        const idx = y * width + x;
        if (z < zBuffer[idx]) {
          zBuffer[idx] = z;
          const pixelIdx = idx * 4;
          frameBuffer.data[pixelIdx] = color[0];
          frameBuffer.data[pixelIdx + 1] = color[1];
          frameBuffer.data[pixelIdx + 2] = color[2];
          frameBuffer.data[pixelIdx + 3] = 255;
        }
      },

      // Draw line (Bresenham)
      drawLine(x0, y0, z0, x1, y1, z1, color) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        const steps = Math.max(dx, dy);
        const dz = steps > 0 ? (z1 - z0) / steps : 0;

        let x = x0, y = y0, z = z0;
        while (true) {
          this.setPixel(x, y, z, color);
          if (x === x1 && y === y1) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x += sx; }
          if (e2 < dx) { err += dx; y += sy; }
          z += dz;
        }
      },

      // Draw filled triangle (scanline)
      drawTriangle(v0, v1, v2, color, shading = 1) {
        // Sort vertices by Y
        const verts = [v0, v1, v2].sort((a, b) => a[1] - b[1]);
        const [top, mid, bot] = verts;

        // Apply shading
        const shadedColor = color.map(c => Math.round(c * shading));

        // Interpolate edge
        const interpolate = (y, p1, p2) => {
          if (p1[1] === p2[1]) return p1;
          const t = (y - p1[1]) / (p2[1] - p1[1]);
          return [
            p1[0] + (p2[0] - p1[0]) * t,
            y,
            p1[2] + (p2[2] - p1[2]) * t
          ];
        };

        // Draw scanlines
        for (let y = Math.ceil(top[1]); y <= Math.floor(bot[1]); y++) {
          let left, right;

          if (y < mid[1]) {
            left = interpolate(y, top, mid);
            right = interpolate(y, top, bot);
          } else {
            left = interpolate(y, mid, bot);
            right = interpolate(y, top, bot);
          }

          if (left[0] > right[0]) [left, right] = [right, left];

          for (let x = Math.ceil(left[0]); x <= Math.floor(right[0]); x++) {
            const t = left[0] === right[0] ? 0 : (x - left[0]) / (right[0] - left[0]);
            const z = left[2] + (right[2] - left[2]) * t;
            this.setPixel(x, y, z, shadedColor);
          }
        }
      },

      // Calculate face normal
      calculateNormal(v0, v1, v2) {
        const e1 = KonomiRenderer.vec3.sub(v1, v0);
        const e2 = KonomiRenderer.vec3.sub(v2, v0);
        return KonomiRenderer.vec3.normalize(KonomiRenderer.vec3.cross(e1, e2));
      },

      // Render mesh
      renderMesh(mesh, transform = KonomiRenderer.mat4.identity()) {
        const mvp = KonomiRenderer.mat4.multiply(this.getViewProjection(), transform);

        for (const face of mesh.faces) {
          // Get vertices
          const v0 = mesh.vertices[face[0]];
          const v1 = mesh.vertices[face[1]];
          const v2 = mesh.vertices[face[2]];

          // Calculate normal for lighting
          const normal = this.calculateNormal(v0, v1, v2);

          // Transform normal by model matrix (simplified)
          const worldNormal = KonomiRenderer.vec3.normalize(normal);

          // Backface culling
          const viewDir = KonomiRenderer.vec3.normalize(
            KonomiRenderer.vec3.sub(this.camera.position, v0)
          );
          if (KonomiRenderer.vec3.dot(worldNormal, viewDir) < 0) continue;

          // Calculate lighting
          const diffuse = Math.max(0, KonomiRenderer.vec3.dot(worldNormal, this.light.direction));
          const shading = this.light.ambient + this.light.diffuse * diffuse;

          // Project vertices
          const p0 = this.project(v0, mvp);
          const p1 = this.project(v1, mvp);
          const p2 = this.project(v2, mvp);

          // Clip against near plane (simplified)
          if (p0[2] < 0 || p1[2] < 0 || p2[2] < 0) continue;

          // Draw triangle
          const color = mesh.color || [200, 200, 200];
          this.drawTriangle(p0, p1, p2, color, shading);
        }
      },

      // Render wireframe
      renderWireframe(mesh, transform = KonomiRenderer.mat4.identity(), color = [0, 255, 0]) {
        const mvp = KonomiRenderer.mat4.multiply(this.getViewProjection(), transform);

        for (const face of mesh.faces) {
          const p0 = this.project(mesh.vertices[face[0]], mvp);
          const p1 = this.project(mesh.vertices[face[1]], mvp);
          const p2 = this.project(mesh.vertices[face[2]], mvp);

          if (p0[2] < 0 || p1[2] < 0 || p2[2] < 0) continue;

          this.drawLine(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], color);
          this.drawLine(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], color);
          this.drawLine(p2[0], p2[1], p2[2], p0[0], p0[1], p0[2], color);
        }
      }
    };

    return renderer;
  },

  // ============================================
  // PRIMITIVE MESH GENERATORS
  // ============================================

  createCube(size = 1) {
    const s = size / 2;
    return {
      vertices: [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
      ],
      faces: [
        [0, 1, 2], [0, 2, 3], // Back
        [4, 6, 5], [4, 7, 6], // Front
        [0, 4, 5], [0, 5, 1], // Bottom
        [2, 6, 7], [2, 7, 3], // Top
        [0, 7, 4], [0, 3, 7], // Left
        [1, 5, 6], [1, 6, 2]  // Right
      ],
      color: [100, 150, 200]
    };
  },

  createSphere(radius = 1, segments = 16, rings = 8) {
    const vertices = [];
    const faces = [];

    for (let ring = 0; ring <= rings; ring++) {
      const phi = (ring / rings) * Math.PI;
      for (let seg = 0; seg <= segments; seg++) {
        const theta = (seg / segments) * Math.PI * 2;
        vertices.push([
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        ]);
      }
    }

    for (let ring = 0; ring < rings; ring++) {
      for (let seg = 0; seg < segments; seg++) {
        const i = ring * (segments + 1) + seg;
        faces.push([i, i + segments + 1, i + 1]);
        faces.push([i + 1, i + segments + 1, i + segments + 2]);
      }
    }

    return { vertices, faces, color: [200, 100, 100] };
  },

  createPlane(width = 2, height = 2, divisionsW = 1, divisionsH = 1) {
    const vertices = [];
    const faces = [];
    const hw = width / 2;
    const hh = height / 2;

    for (let y = 0; y <= divisionsH; y++) {
      for (let x = 0; x <= divisionsW; x++) {
        vertices.push([
          -hw + (x / divisionsW) * width,
          0,
          -hh + (y / divisionsH) * height
        ]);
      }
    }

    for (let y = 0; y < divisionsH; y++) {
      for (let x = 0; x < divisionsW; x++) {
        const i = y * (divisionsW + 1) + x;
        faces.push([i, i + divisionsW + 1, i + 1]);
        faces.push([i + 1, i + divisionsW + 1, i + divisionsW + 2]);
      }
    }

    return { vertices, faces, color: [150, 150, 150] };
  },

  createCylinder(radius = 0.5, height = 2, segments = 16) {
    const vertices = [];
    const faces = [];
    const halfHeight = height / 2;

    // Top and bottom center
    vertices.push([0, halfHeight, 0]);   // 0: top center
    vertices.push([0, -halfHeight, 0]);  // 1: bottom center

    // Side vertices
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      vertices.push([x, halfHeight, z]);   // top ring
      vertices.push([x, -halfHeight, z]);  // bottom ring
    }

    // Top and bottom faces
    for (let i = 0; i < segments; i++) {
      const topIdx = 2 + i * 2;
      faces.push([0, topIdx, topIdx + 2]);
      faces.push([1, topIdx + 3, topIdx + 1]);
    }

    // Side faces
    for (let i = 0; i < segments; i++) {
      const topIdx = 2 + i * 2;
      faces.push([topIdx, topIdx + 1, topIdx + 2]);
      faces.push([topIdx + 1, topIdx + 3, topIdx + 2]);
    }

    return { vertices, faces, color: [100, 200, 100] };
  }
};
