/**
 * Der Nebel im Hero der Startseite: gebogenes Rauschen in einem einzigen
 * Fragment-Shader, ohne Bibliothek. Vorbild ist der «Fog»-Effekt von
 * Vanta.js — der braucht three.js, zusammen 155 KB gzip, mehr als die ganze
 * Startseite. Dieser Shader braucht keine 3.
 *
 * Sparsam gebaut: Nebel ist ohnehin unscharf, gerechnet wird deshalb in
 * einem Drittel der Auflösung und höchstens 30-mal je Sekunde. Er steht
 * still, sobald niemand hinsieht — Hero ausser Sicht, Tab im Hintergrund,
 * angehalten oder reduzierte Bewegung eingestellt.
 */

export type FogColors = readonly [string, string, string, string];

export interface FogOptions {
  colors: FogColors;
  animate: boolean;
}

export interface Fog {
  update(options: FogOptions): void;
  destroy(): void;
}

const VERTEX = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

/*
 * Hinter dem Text bleibt der Grund ruhig: dort mischt der Nebel höchstens
 * 18 Prozent Farbe bei, mehr ginge zulasten der Lesbarkeit von grauem
 * Fliesstext. Die ruhige Fläche ist der Block mit `data-fog-calm`, gemessen
 * bei jeder Grössenänderung — so stimmt sie bei 320 wie bei 1440 Pixeln.
 * Ausserhalb zeigt der Nebel seine volle Farbe.
 */
const FRAGMENT = `precision mediump float;
uniform vec2 u_res;uniform float u_t;uniform vec2 u_ptr;uniform vec4 u_calm;uniform vec3 c0,c1,c2,c3;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){
vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv*vec2(u_res.x/u_res.y,1.)*1.5;float t=u_t*.065;
vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-t));
vec2 r=vec2(fbm(p+3.5*q+vec2(1.7,9.2)+.15*t+(u_ptr-.5)*.5),fbm(p+3.5*q+vec2(8.3,2.8)-.12*t));
float f=fbm(p+3.*r);
vec3 col=mix(c0,c1,clamp(f*f*2.4,0.,1.));
col=mix(col,c2,clamp(length(q)*1.05-.35,0.,1.));
col=mix(col,c3,clamp(r.x*r.x*1.6-.35,0.,1.)*.85);
vec2 d=max(u_calm.xy-uv,uv-u_calm.zw);float open=smoothstep(0.,.12,length(max(d,0.)));
gl_FragColor=vec4(mix(c0,col,mix(.18,1.,open)),1.);}`;

const SCALE = 1 / 3;
const FRAME_MS = 33;
/** Ein Zeitpunkt mitten im Ablauf; t = 0 sieht noch nach gleichmässigem Rauschen aus. */
const T_OFFSET = 40_000;

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Null, wenn der Browser kein WebGL kann. Dann bleibt der ruhige Grund stehen. */
export function createFog(canvas: HTMLCanvasElement, initial: FogOptions): Fog | null {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // Ein Dreieck, das den ganzen Bildschirm deckt — weniger als ein Rechteck aus zwei.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    res: uniform('u_res'),
    t: uniform('u_t'),
    ptr: uniform('u_ptr'),
    calm: uniform('u_calm'),
    colors: ['c0', 'c1', 'c2', 'c3'].map(uniform),
  };

  const host = canvas.parentElement ?? canvas;
  let options = initial;
  let pointer: [number, number] = [0.5, 0.5];
  let target: [number, number] = [0.5, 0.5];
  let frame = 0;
  let last = 0;
  let running = false;
  let visible = true;
  const started = performance.now();

  function draw(time: number) {
    gl!.uniform1f(u.t, time / 1000);
    gl!.uniform2f(u.ptr, pointer[0], pointer[1]);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function resize() {
    const width = Math.max(1, Math.round(host.clientWidth * SCALE));
    const height = Math.max(1, Math.round(host.clientHeight * SCALE));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl!.viewport(0, 0, width, height);
    }
    gl!.uniform2f(u.res, width, height);

    // Die ruhige Fläche in Bildkoordinaten, y von unten, mit etwas Luft um den Text.
    const box = host.getBoundingClientRect();
    const calm = host.querySelector<HTMLElement>('[data-fog-calm]')?.getBoundingClientRect();
    if (calm && box.width > 0 && box.height > 0) {
      const air = 24;
      gl!.uniform4f(
        u.calm,
        (calm.left - air - box.left) / box.width,
        (box.bottom - calm.bottom - air) / box.height,
        (calm.right + air - box.left) / box.width,
        (box.bottom - calm.top + air) / box.height,
      );
    } else {
      gl!.uniform4f(u.calm, 2, 2, 2, 2);
    }
  }

  function apply() {
    options.colors.forEach((hex, i) => gl!.uniform3fv(u.colors[i] ?? null, rgb(hex)));
  }

  // Der Maus folgt er träge: das Ziel springt, der Nebel zieht nach.
  function loop(now: number) {
    frame = requestAnimationFrame(loop);
    if (now - last < FRAME_MS) return;
    last = now;
    pointer = [
      pointer[0] + (target[0] - pointer[0]) * 0.05,
      pointer[1] + (target[1] - pointer[1]) * 0.05,
    ];
    draw(now - started + T_OFFSET);
  }

  function sync() {
    const go = options.animate && visible && !document.hidden;
    if (go && !running) {
      running = true;
      last = 0;
      frame = requestAnimationFrame(loop);
    } else if (!go && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }

  function onPointer(event: PointerEvent) {
    const box = host.getBoundingClientRect();
    target = [(event.clientX - box.left) / box.width, 1 - (event.clientY - box.top) / box.height];
  }

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) host.addEventListener('pointermove', onPointer, { passive: true });
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    sync();
  });
  intersection.observe(host);
  const resizing = new ResizeObserver(() => {
    resize();
    if (!running) draw(T_OFFSET);
  });
  resizing.observe(host);
  document.addEventListener('visibilitychange', sync);

  resize();
  apply();
  draw(T_OFFSET);
  sync();

  return {
    update(next) {
      options = next;
      apply();
      if (!running) draw(T_OFFSET);
      sync();
    },
    destroy() {
      running = false;
      cancelAnimationFrame(frame);
      intersection.disconnect();
      resizing.disconnect();
      document.removeEventListener('visibilitychange', sync);
      if (fine) host.removeEventListener('pointermove', onPointer);
      // Den Kontext nicht verwerfen: React baut die Komponente im Entwicklungsmodus
      // zur Probe zweimal auf, und der zweite Aufbau fände einen toten Kontext vor.
      // Mit der Leinwand verschwindet er ohnehin.
    },
  };
}
