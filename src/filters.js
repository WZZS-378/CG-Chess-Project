// filters.js — Post-processing screen filters
// Renders the scene to a framebuffer, then applies a fullscreen shader.
// Integrates with the existing settings panel via buildFiltersUI().
// Hooks into animate.js's render loop by overriding renderer.render.

(function () {
  // ── Filter definitions ─────────────────────────────────────────────────────
  // Each filter has:
  //   label    : display name
  //   frag     : GLSL fragment shader (uSampler = scene texture, vUv = tex coords)
  //   uniforms : extra uniforms { name: { type, value } }  (time is always injected)

  var FILTERS = {
    none: {
      label: "None",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        void main() {
          gl_FragColor = texture2D(uSampler, vUv);
        }
      `,
    },

    // ── Black & White TV ─────────────────────────────────────────────────────
    bwtv: {
      label: "B&W TV",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        uniform float uTime;
        uniform vec2 uResolution;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          // Subtle barrel distortion
          vec2 uv = vUv - 0.5;
          float r2 = dot(uv, uv);
          uv *= 1.0 + r2 * 0.06;
          uv += 0.5;

          vec4 col = texture2D(uSampler, uv);

          // Desaturate
          float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));

          // Contrast boost
          luma = clamp((luma - 0.5) * 1.35 + 0.5, 0.0, 1.0);

          // Scanlines
          float scanline = sin(vUv.y * uResolution.y * 1.5) * 0.5 + 0.5;
          scanline = mix(0.75, 1.0, scanline);

          // Film grain
          float grain = rand(vUv + fract(uTime * 0.07)) * 0.12 - 0.06;

          // Vertical roll jitter (very subtle)
          float roll = sin(uTime * 0.4 + vUv.y * 2.0) * 0.003;
          luma += roll;

          // Vignette
          vec2 vig = vUv - 0.5;
          float vignette = 1.0 - dot(vig, vig) * 2.2;
          vignette = clamp(vignette, 0.0, 1.0);

          float final = (luma + grain) * scanline * vignette;
          gl_FragColor = vec4(vec3(final), 1.0);
        }
      `,
    },

    // ── Pixel Art ────────────────────────────────────────────────────────────
    pixel: {
      label: "Pixel Art",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        uniform vec2 uResolution;

        void main() {
          float pixelSize = 4.0;
          vec2 blockSize = pixelSize / uResolution;
          vec2 snapped = floor(vUv / blockSize) * blockSize + blockSize * 0.5;
          vec4 col = texture2D(uSampler, snapped);

          // Quantize colors to limited palette (32 levels)
          col.rgb = floor(col.rgb * 32.0 + 0.5) / 32.0;

          // Subtle grid lines between pixels
          vec2 edge = mod(vUv, blockSize) / blockSize;
          float grid = step(0.92, max(edge.x, edge.y));
          col.rgb *= 1.0 - grid * 0.35;

          gl_FragColor = col;
        }
      `,
    },
    
    // ── VHS ──────────────────────────────────────────────────────────────────
    vhs: {
      label: "VHS Tape",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        uniform float uTime;
        uniform vec2 uResolution;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;

          // Horizontal tracking jitter bands
          float band = step(0.97, rand(vec2(floor(uv.y * 30.0), floor(uTime * 8.0))));
          uv.x += band * (rand(vec2(uv.y, uTime)) - 0.5) * 0.04;

          // Slow horizontal wobble
          uv.x += sin(uv.y * 5.0 + uTime * 0.7) * 0.003;

          // RGB channel separation (chromatic aberration)
          float shift = 0.006 + band * 0.012;
          float r = texture2D(uSampler, uv + vec2(shift, 0.0)).r;
          float g = texture2D(uSampler, uv).g;
          float b = texture2D(uSampler, uv - vec2(shift, 0.0)).b;

          vec3 col = vec3(r, g, b);

          // Scanlines
          float scanline = sin(uv.y * uResolution.y * 1.2) * 0.5 + 0.5;
          col *= mix(0.85, 1.0, scanline);

          // Tape noise
          float noise = rand(uv + fract(uTime * 0.13)) * 0.08 - 0.04;
          col += noise;

          // Colour bleed — smear colour horizontally
          vec3 bleed = texture2D(uSampler, uv + vec2(0.012, 0.0)).rgb;
          col = mix(col, col + bleed * 0.08, 0.4);

          // Slight over-saturation
          float luma = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(vec3(luma), col, 1.3);

          // Faded slightly (VHS warmth)
          col = col * 0.9 + 0.05;

          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `,
    },

    // ── Night Vision ─────────────────────────────────────────────────────────
    nightvision: {
      label: "Night Vision",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        uniform float uTime;
        uniform vec2 uResolution;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;

          // Barrel distortion (optics)
          vec2 d = uv - 0.5;
          float r2 = dot(d, d);
          uv = d * (1.0 + r2 * 0.12) + 0.5;

          vec4 col = texture2D(uSampler, clamp(uv, 0.0, 1.0));

          // Luminance only
          float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));

          // Boost gain — NV amplifies faint signals
          luma = clamp(luma * 2.2, 0.0, 1.0);

          // Phosphor grain
          float grain = rand(uv + fract(uTime * 0.19)) * 0.15;
          luma = clamp(luma + grain * 0.4 - 0.08, 0.0, 1.0);

          // Scanlines
          float scan = sin(uv.y * uResolution.y * 1.0) * 0.5 + 0.5;
          luma *= mix(0.8, 1.0, scan);

          // Green phosphor tint
          vec3 nvColor = vec3(luma * 0.18, luma * 1.0, luma * 0.22);

          // Vignette
          float vign = 1.0 - dot(d, d) * 3.0;
          vign = clamp(vign, 0.0, 1.0);
          nvColor *= vign;

          // Occasional flicker
          float flicker = 0.95 + sin(uTime * 23.0) * 0.02 + sin(uTime * 7.3) * 0.03;
          nvColor *= flicker;

          gl_FragColor = vec4(nvColor, 1.0);
        }
      `,
    },

    // ── Thermal ──────────────────────────────────────────────────────────────
    thermal: {
      label: "Thermal Camera",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        uniform float uTime;

        // Classic thermal color ramp: black → blue → cyan → green → yellow → red → white
        vec3 thermalRamp(float t) {
          t = clamp(t, 0.0, 1.0);
          vec3 col;
          if (t < 0.2) {
            col = mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), t / 0.2);
          } else if (t < 0.4) {
            col = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), (t - 0.2) / 0.2);
          } else if (t < 0.6) {
            col = mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 1.0, 0.0), (t - 0.4) / 0.2);
          } else if (t < 0.8) {
            col = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.6) / 0.2);
          } else {
            col = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 1.0), (t - 0.8) / 0.2);
          }
          return col;
        }

        void main() {
          vec4 col = texture2D(uSampler, vUv);

          // Use luminance as "heat"
          float heat = dot(col.rgb, vec3(0.299, 0.587, 0.114));

          // Slight shimmer — heat haze
          vec2 haze = vUv;
          haze.x += sin(vUv.y * 30.0 + uTime * 2.0) * 0.001 * heat;
          vec4 haze_col = texture2D(uSampler, haze);
          heat = mix(heat, dot(haze_col.rgb, vec3(0.299, 0.587, 0.114)), 0.3);

          // Map through ramp
          vec3 thermal = thermalRamp(heat);

          // Low-res pixelation to mimic thermal sensor grid
          // (already uses the full-res texture but posterizes the ramp)
          thermal = floor(thermal * 24.0) / 24.0;

          gl_FragColor = vec4(thermal, 1.0);
        }
      `,
    },

    // ── Glitch ───────────────────────────────────────────────────────────────
    glitch: {
      label: "Glitch",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        uniform float uTime;
        uniform vec2 uResolution;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float hash(float n) {
          return fract(sin(n) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv;

          // Block corruption — horizontal slices that randomly shift
          float blockY = floor(uv.y * 22.0);
          float blockTime = floor(uTime * 12.0);
          float blockNoise = rand(vec2(blockY, blockTime));
          float isCorrupt = step(0.88, blockNoise);

          float xShift = (rand(vec2(blockY, blockTime + 0.1)) - 0.5) * 0.12;
          uv.x = mix(uv.x, fract(uv.x + xShift), isCorrupt);

          // Occasional full-row displacement
          float bigBlock = floor(uv.y * 8.0);
          float bigNoise = rand(vec2(bigBlock, floor(uTime * 4.0)));
          float isBig = step(0.96, bigNoise);
          uv.x = mix(uv.x, fract(uv.x + (rand(vec2(bigBlock, uTime)) - 0.5) * 0.35), isBig);

          // RGB split
          float rShift = 0.008 * (1.0 + isCorrupt * 3.0);
          float r = texture2D(uSampler, uv + vec2(rShift, 0.0)).r;
          float g = texture2D(uSampler, uv).g;
          float b = texture2D(uSampler, uv - vec2(rShift * 0.5, 0.0)).b;
          vec3 col = vec3(r, g, b);

          // Digital noise overlay
          float noise = rand(uv + fract(uTime * 0.21)) * isCorrupt * 0.5;
          col += noise;

          // Scanline flicker
          float scan = sin(uv.y * uResolution.y * 1.5 + uTime * 30.0) * 0.5 + 0.5;
          col *= mix(1.0, 0.85, scan * isCorrupt * 0.6);

          // Occasional full white flash
          float flash = step(0.998, rand(vec2(floor(uTime * 20.0), 0.0)));
          col = mix(col, vec3(1.0), flash);

          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `,
    },

    // ── Sepia / Old Photograph ────────────────────────────────────────────────
    sepia: {
      label: "Old Photograph",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        uniform float uTime;
        uniform vec2 uResolution;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;

          // Slight warp (old paper)
          uv += vec2(
            sin(uv.y * 3.0 + uTime * 0.05) * 0.002,
            cos(uv.x * 2.5 + uTime * 0.04) * 0.002
          );

          vec4 col = texture2D(uSampler, clamp(uv, 0.0, 1.0));
          float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));

          // Sepia tones
          vec3 sepia = vec3(
            luma * 1.07 + 0.12,
            luma * 0.94,
            luma * 0.68
          );

          // Film grain
          float grain = rand(uv + fract(uTime * 0.05)) * 0.12 - 0.06;
          sepia += grain;

          // Aged scratches — vertical lines
          float scratch = step(0.997, rand(vec2(floor(uv.x * uResolution.x * 0.5), floor(uTime * 2.0))));
          sepia = mix(sepia, vec3(0.95, 0.9, 0.7), scratch);

          // Vignette (heavy, oval)
          vec2 vig = (uv - 0.5) * vec2(1.0, 1.3);
          float vignette = 1.0 - dot(vig, vig) * 2.8;
          vignette = clamp(vignette, 0.0, 1.0);
          vignette = pow(vignette, 1.5);
          sepia *= vignette;

          // Fade to warm cream at extreme edges
          sepia = mix(vec3(0.82, 0.72, 0.5), sepia, vignette);

          gl_FragColor = vec4(clamp(sepia, 0.0, 1.0), 1.0);
        }
      `,
    },

    // ── Infrared ─────────────────────────────────────────────────────────────
    infrared: {
      label: "Infrared Film",
      frag: `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uSampler;
        uniform float uTime;
        uniform vec2 uResolution;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec4 col = texture2D(uSampler, vUv);

          // IR: swap red and luminance channels, kill blue
          float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));
          float ir = col.r * 1.5 - col.b * 0.8; // IR channel (simulated)
          ir = clamp(ir, 0.0, 1.0);

          // High contrast black & white with IR channel boosted
          float irLuma = mix(luma, ir, 0.7);
          irLuma = clamp((irLuma - 0.4) * 2.0 + 0.5, 0.0, 1.0); // hard contrast

          // Bloom on bright areas
          float bloom = smoothstep(0.7, 1.0, irLuma);
          irLuma += bloom * 0.3;

          // Fine-grained noise (IR film grain is distinct)
          float grain = (rand(vUv + fract(uTime * 0.09)) - 0.5) * 0.14;
          irLuma = clamp(irLuma + grain, 0.0, 1.0);

          // Very light warm tint (true IR has a faint pinkish cast)
          vec3 final = vec3(irLuma * 1.05, irLuma * 0.95, irLuma * 0.85);

          gl_FragColor = vec4(clamp(final, 0.0, 1.0), 1.0);
        }
      `,
    },
  }; // end FILTERS

  // ── WebGL post-processing setup ────────────────────────────────────────────

  var gl = null;
  var filterProgram = null;
  var filterFramebuffer = null;
  var filterTexture = null;
  var filterRenderBuffer = null;
  var quadBuffer = null;
  var activeFilterKey = "none";
  var filterInitialized = false;
  var postCanvas = null;
  var postCtx = null;
  var filterWidth = 0;
  var filterHeight = 0;

  var vertSrc = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      vUv.y = 1.0 - vUv.y;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  function compileShader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function buildProgram(gl, fragSrc) {
    var vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    var frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  function initPostProcessing() {
    // Create a secondary canvas overlaid on the Three.js canvas
    postCanvas = document.createElement("canvas");
    postCanvas.style.cssText =
      "position:absolute;top:0;left:0;pointer-events:none;z-index:5";
    document.body.appendChild(postCanvas);

    gl = postCanvas.getContext("webgl", { preserveDrawingBuffer: false });
    if (!gl) {
      console.warn("WebGL not available for filters");
      return false;
    }

    // Full-screen quad
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    resizeFilter();
    filterInitialized = true;
    return true;
  }

  function resizeFilter() {
    if (!gl) return;
    filterWidth = window.innerWidth;
    filterHeight = window.innerHeight;
    postCanvas.width = filterWidth;
    postCanvas.height = filterHeight;
    gl.viewport(0, 0, filterWidth, filterHeight);

    // Recreate framebuffer at new size
    if (filterFramebuffer) gl.deleteFramebuffer(filterFramebuffer);
    if (filterTexture) gl.deleteTexture(filterTexture);
    if (filterRenderBuffer) gl.deleteRenderbuffer(filterRenderBuffer);

    filterTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, filterTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      filterWidth,
      filterHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    filterRenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, filterRenderBuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      filterWidth,
      filterHeight,
    );

    filterFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, filterFramebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      filterTexture,
      0,
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      filterRenderBuffer,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function buildFilterProgram(key) {
    if (!gl) return;
    if (filterProgram) gl.deleteProgram(filterProgram);
    filterProgram = buildProgram(gl, FILTERS[key].frag);
  }

  // ── Render hook ────────────────────────────────────────────────────────────
  // We intercept Three.js renderer.render so we can:
  //   1. Redirect Three.js to render into a hidden canvas
  //   2. Copy that canvas to our filter texture
  //   3. Apply the shader fullscreen on our postCanvas

  var _origRender = null;
  var threeCanvas = null;
  var filterStartTime = performance.now();
  var hiddenCanvas = null;

  function hookRenderer() {
    if (!window.renderer) return;
    threeCanvas = renderer.domElement;

    // Hidden canvas to read Three.js pixels via drawImage
    hiddenCanvas = document.createElement("canvas");
    hiddenCanvas.width = filterWidth;
    hiddenCanvas.height = filterHeight;

    var _orig = renderer.render.bind(renderer);

    renderer.render = function (scene, camera) {
      if (activeFilterKey === "none" || !filterInitialized) {
        _orig(scene, camera);
        postCanvas.style.display = "none";
        return;
      }

      // Three.js renders to its own canvas (preserveDrawingBuffer = true needed)
      // We enable it temporarily here by patching the renderer context
      _orig(scene, camera);

      // Copy Three.js output to filter texture using 2D canvas as bridge
      var ctx2d = hiddenCanvas.getContext("2d");
      if (
        hiddenCanvas.width !== filterWidth ||
        hiddenCanvas.height !== filterHeight
      ) {
        hiddenCanvas.width = filterWidth;
        hiddenCanvas.height = filterHeight;
      }
      ctx2d.drawImage(threeCanvas, 0, 0, filterWidth, filterHeight);

      gl.bindTexture(gl.TEXTURE_2D, filterTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        hiddenCanvas,
      );

      // Draw fullscreen quad with filter shader
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, filterWidth, filterHeight);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(filterProgram);

      var aPos = gl.getAttribLocation(filterProgram, "aPosition");
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      // Sampler
      var uSampler = gl.getUniformLocation(filterProgram, "uSampler");
      gl.uniform1i(uSampler, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, filterTexture);

      // Time
      var uTime = gl.getUniformLocation(filterProgram, "uTime");
      if (uTime)
        gl.uniform1f(uTime, (performance.now() - filterStartTime) / 1000.0);

      // Resolution
      var uRes = gl.getUniformLocation(filterProgram, "uResolution");
      if (uRes) gl.uniform2f(uRes, filterWidth, filterHeight);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      postCanvas.style.display = "block";
    };

    _origRender = _orig;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  window.setScreenFilter = function (key) {
    if (!FILTERS[key]) return;
    activeFilterKey = key;

    if (key === "none") {
      if (postCanvas) postCanvas.style.display = "none";
      return;
    }

    if (!filterInitialized) {
      if (!initPostProcessing()) return;
      hookRenderer();
    }

    // Need preserveDrawingBuffer on the Three.js renderer to read its pixels
    if (
      renderer &&
      !renderer.getContext().getContextAttributes().preserveDrawingBuffer
    ) {
      renderer.preserveDrawingBuffer = true;
    }

    buildFilterProgram(key);

    // Force re-render so filter appears immediately
    if (typeof scene !== "undefined" && typeof camera !== "undefined") {
      renderer.render(scene, camera);
    }
  };

  // ── Settings panel integration ─────────────────────────────────────────────

  window.buildFiltersUI = function (panel) {
    // Divider
    var hr = document.createElement("hr");
    hr.style.cssText = "border:none;border-top:1px solid #bbb;margin:8px 0";
    panel.appendChild(hr);

    // Header
    var header = document.createElement("div");
    header.textContent = "Screen Filters";
    header.style.cssText =
      "font-weight:bold;margin-bottom:6px;font-size:14px;font-family:sans-serif";
    panel.appendChild(header);

    // Row + Select
    var row = document.createElement("div");
    row.style.cssText = "margin-bottom:8px";

    var lbl = document.createElement("label");
    lbl.textContent = "Filter:";
    lbl.style.cssText =
      "display:inline-block;width:120px;font-size:13px;font-family:sans-serif";

    var sel = document.createElement("select");
    sel.style.cssText =
      "padding:3px 6px;border-radius:3px;border:1px solid #999;font-size:13px";

    Object.keys(FILTERS).forEach(function (k) {
      var opt = document.createElement("option");
      opt.value = k;
      opt.textContent = FILTERS[k].label;
      sel.appendChild(opt);
    });

    sel.addEventListener("change", function () {
      window.setScreenFilter(sel.value);
    });

    row.appendChild(lbl);
    row.appendChild(sel);
    panel.appendChild(row);

    // Description hint
    var hint = document.createElement("div");
    hint.id = "filter-hint";
    hint.style.cssText =
      "font-size:11px;color:#777;font-family:sans-serif;margin-bottom:4px;font-style:italic";
    hint.textContent = "Real-time GLSL shader applied to the scene";
    panel.appendChild(hint);
  };

  // ── Wire up resize ─────────────────────────────────────────────────────────
  window.addEventListener("resize", function () {
    if (filterInitialized) resizeFilter();
  });

  // ── Auto-init hook once renderer is available ──────────────────────────────
  // Tries immediately, then polls until renderer exists
  function tryHook() {
    if (window.renderer && window.scene && window.camera) {
      // Delay one frame so Three.js canvas is in the DOM
      requestAnimationFrame(function () {
        if (!filterInitialized && activeFilterKey !== "none") {
          initPostProcessing();
          hookRenderer();
        }
      });
    } else {
      setTimeout(tryHook, 200);
    }
  }
  tryHook();
})();
