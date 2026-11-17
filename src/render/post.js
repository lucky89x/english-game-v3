// Post-processing without extra libraries: the scene is drawn into a float target, bright parts are blurred into a
// soft glow (bloom), then one full-screen pass adds the glow, tone-maps, grades the colours towards a warm storybook
// look and darkens the corners a little. Off on the "low" quality level, so weak machines pay nothing.
import * as THREE from 'three';

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
quad.frustumCulled = false;
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), stage = new THREE.Scene();
stage.add(quad);
const pass = (fs, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false, ...extra });

export class Post {
  constructor(renderer) {
    this.r = renderer; this.on = false; this.shafts = false; this.w = 0; this.h = 0; this.samples = 0;
    this.bright = pass(`uniform sampler2D tMap; uniform float uThreshold; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tMap, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        gl_FragColor = vec4(c * smoothstep(uThreshold, uThreshold + 0.6, l), 1.0); }`, { tMap: { value: null }, uThreshold: { value: 0.82 } });
    this.blur = pass(`uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tMap, vUv).rgb * 0.227;
        c += (texture2D(tMap, vUv + uDir * 1.385).rgb + texture2D(tMap, vUv - uDir * 1.385).rgb) * 0.316;
        c += (texture2D(tMap, vUv + uDir * 3.231).rgb + texture2D(tMap, vUv - uDir * 3.231).rgb) * 0.070;
        gl_FragColor = vec4(c, 1.0); }`, { tMap: { value: null }, uDir: { value: new THREE.Vector2() } });
    // light shafts: radial blur towards the sun of the bright, far parts of the picture (quarter size, cheap)
    this.shaft = pass(`uniform sampler2D tMap; uniform vec2 uSun; uniform float uAspect; varying vec2 vUv;
      void main(){ vec2 d = (uSun - vUv) / 24.0 * 0.9; vec2 p = vUv; vec3 acc = vec3(0.0); float w = 1.0;
        for (int i = 0; i < 24; i++) { vec3 c = texture2D(tMap, p).rgb; float l = dot(c, vec3(0.299, 0.587, 0.114));
          acc += c * smoothstep(0.55, 0.95, l) * w; w *= 0.93; p += d; }
        vec2 q = (vUv - uSun) * vec2(uAspect, 1.0);
        gl_FragColor = vec4(acc / 9.0 * (1.0 - smoothstep(0.2, 2.2, length(q))), 1.0); }`, { tMap: { value: null }, uSun: { value: new THREE.Vector2(0.5, 0.9) }, uAspect: { value: 1 } });
    this.sunK = 0;
    // final pass: glow, tone mapping (renderer setting), warm grade, soft contrast, saturation, vignette
    this.final = pass(`uniform sampler2D tMap; uniform sampler2D tGlowA; uniform sampler2D tGlowB; uniform sampler2D tShaft; uniform float uShaft; uniform float uGlow; uniform float uVignette; uniform float uSat; uniform vec3 uTint; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tMap, vUv).rgb + (texture2D(tGlowA, vUv).rgb * 0.6 + texture2D(tGlowB, vUv).rgb) * uGlow + texture2D(tShaft, vUv).rgb * vec3(1.0, 0.86, 0.62) * uShaft;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        vec3 g = gl_FragColor.rgb;
        g *= uTint;                                              // warm sunlight
        g = mix(g, g * g * (3.0 - 2.0 * g), 0.22);                // gentle S-curve
        float l = dot(g, vec3(0.299, 0.587, 0.114));
        g = mix(vec3(l), g, uSat);                               // richer colours
        g += vec3(0.020, 0.012, 0.0) * (1.0 - l);                 // warm shadows, never pure black
        vec2 d = vUv - 0.5; g *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(d, d) * 2.0);
        gl_FragColor = vec4(clamp(g, 0.0, 1.0), 1.0);
      }`, { tMap: { value: null }, tGlowA: { value: null }, tGlowB: { value: null }, tShaft: { value: null }, uShaft: { value: 0 }, uGlow: { value: 0.55 }, uVignette: { value: 0.32 }, uSat: { value: 1.06 }, uTint: { value: new THREE.Vector3(1.03, 1.0, 0.95) } }, { toneMapped: true });
  }
  /** Sun position for the light shafts: dir is the world direction towards the sun. */
  setSun(camera, dir) {
    const fwd = camera.getWorldDirection(new THREE.Vector3()), k = fwd.dot(dir);
    this.sunK = this.shafts ? Math.max(0, (k - 0.15) / 0.85) : 0;
    if (this.sunK > 0) { const p = camera.position.clone().addScaledVector(dir, 100).project(camera); this.shaft.uniforms.uSun.value.set(p.x * 0.5 + 0.5, p.y * 0.5 + 0.5); }
  }
  /** Turns the effect on or off and sets the multisampling of the scene target (0 = none). */
  set(on, samples = 4) { if (this.on !== on || this.samples !== samples) { this.on = on; this.samples = samples; this.w = 0; } }
  size() {
    const s = this.r.getDrawingBufferSize(new THREE.Vector2()), w = s.x, h = s.y; if (w === this.w && h === this.h) return;
    this.w = w; this.h = h; for (const t of [this.scene, this.a1, this.a2, this.b1, this.b2]) if (t) t.dispose();
    const opt = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.scene = new THREE.WebGLRenderTarget(w, h, { ...opt, depthBuffer: true, samples: this.samples });
    const w2 = Math.max(2, w >> 1), h2 = Math.max(2, h >> 1), w4 = Math.max(2, w >> 2), h4 = Math.max(2, h >> 2);
    this.a1 = new THREE.WebGLRenderTarget(w2, h2, opt); this.a2 = new THREE.WebGLRenderTarget(w2, h2, opt);
    this.b1 = new THREE.WebGLRenderTarget(w4, h4, opt); this.b2 = new THREE.WebGLRenderTarget(w4, h4, opt);
  }
  draw(mat, target) { quad.material = mat; this.r.setRenderTarget(target); this.r.render(stage, cam); }
  render(scene, camera) {
    const r = this.r;
    if (!this.on) { r.setRenderTarget(null); r.render(scene, camera); return; }
    this.size();
    r.setRenderTarget(this.scene); r.render(scene, camera);
    const B = this.blur.uniforms;
    this.bright.uniforms.tMap.value = this.scene.texture; this.draw(this.bright, this.a1);
    B.tMap.value = this.a1.texture; B.uDir.value.set(1 / this.a1.width, 0); this.draw(this.blur, this.a2);
    B.tMap.value = this.a2.texture; B.uDir.value.set(0, 1 / this.a1.height); this.draw(this.blur, this.a1);
    B.tMap.value = this.a1.texture; B.uDir.value.set(1 / this.b1.width, 0); this.draw(this.blur, this.b1);     // wider, quarter size
    B.tMap.value = this.b1.texture; B.uDir.value.set(0, 1 / this.b1.height); this.draw(this.blur, this.b2);
    B.tMap.value = this.b2.texture; B.uDir.value.set(1.6 / this.b1.width, 0); this.draw(this.blur, this.b1);
    B.tMap.value = this.b1.texture; B.uDir.value.set(0, 1.6 / this.b1.height); this.draw(this.blur, this.b2);
    const F = this.final.uniforms; F.uShaft.value = this.sunK * 0.6;
    if (this.sunK > 0) { this.shaft.uniforms.tMap.value = this.scene.texture; this.shaft.uniforms.uAspect.value = this.w / this.h; this.draw(this.shaft, this.b1); F.tShaft.value = this.b1.texture; }
    else F.tShaft.value = this.b2.texture;
    F.tMap.value = this.scene.texture; F.tGlowA.value = this.a1.texture; F.tGlowB.value = this.b2.texture;
    this.draw(this.final, null);
  }
}
