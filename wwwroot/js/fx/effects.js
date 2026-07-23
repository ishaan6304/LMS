//                               EFFECTS CONFIG                               //

//          EDIT THE VALUES BELOW to precisely tune every react bit.          //
//          Colours that are CSS-based (buttons, card borders) live          //
//          in /css/theme.css instead (see the comment at the top).          //

const FX_CONFIG = {

    //          LineWaves background (react bits "Line Waves")          //
    lineWaves: {
        color1: "#0057fd",            // deep blue lines
        color2: "#000000",            // black (keeps the middle dark)
        color3: "#00c3ff",            // sky blue lines
        speed: 0.3,                   // animation speed
        innerLineCount: 30,           // line density in the centre
        outerLineCount: 30,           // line density at the edges
        warpIntensity: 0.1,           // how much the lines bend
        rotation: -45,                // rotation in degrees
        edgeFadeWidth: 0,             // fade lines out near edges (0 = off)
        colorCycleSpeed: 1,           // how fast the colours shift around
        brightness: 0.07,              // overall brightness
        enableMouseInteraction: true,// true = lines warp near the cursor
        mouseInfluence: 1             // strength of the mouse warp
    },

    //          SpecularButton (rim light on every button)          //
    specularButton: {
        radius: 260                   // cursor distance (px) where the rim appears
    },

    //          BorderGlow cards          //
    borderGlow: {
        reach: 80                     // cursor distance (px) outside a card that still glows
    },

    //          Dock desktop icons (admin dashboard)          //
    dock: {
        range: 180,                   // distance (px) where icons start growing
        magnify: 0.35                 // 0.35 = icons grow up to 135%
    }
};

//                               line waves background                               //

//          WebGL port of the react bit - runs on every page.          //

function hexToVec3(hex) {
    const h = hex.replace("#", "");
    return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255
    ];
}

const LINE_WAVES_VERTEX = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const LINE_WAVES_FRAGMENT = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uInnerLines;
uniform float uOuterLines;
uniform float uWarpIntensity;
uniform float uRotation;
uniform float uEdgeFadeWidth;
uniform float uColorCycleSpeed;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define HALF_PI 1.5707963

float hashF(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

float smoothNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hashF(i), hashF(i + 1.0), u);
}

float displaceA(float coord, float t) {
  float result = sin(coord * 2.123) * 0.2;
  result += sin(coord * 3.234 + t * 4.345) * 0.1;
  result += sin(coord * 0.589 + t * 0.934) * 0.5;
  return result;
}

float displaceB(float coord, float t) {
  float result = sin(coord * 1.345) * 0.3;
  result += sin(coord * 2.734 + t * 3.345) * 0.2;
  result += sin(coord * 0.189 + t * 0.934) * 0.3;
  return result;
}

vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 coords = gl_FragCoord.xy / uResolution.xy;
  coords = coords * 2.0 - 1.0;
  coords = rotate2D(coords, uRotation);

  float halfT = uTime * uSpeed * 0.5;
  float fullT = uTime * uSpeed;

  float mouseWarp = 0.0;
  if (uEnableMouse) {
    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
    float mDist = length(coords - mPos);
    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
  }

  float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
  float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;

  vec2 fieldA = vec2(warpAx, warpAy);
  vec2 fieldB = vec2(warpBx, warpBy);
  vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));

  float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
  float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
  float vMask = 1.0 - max(fadeTop, fadeBottom);

  float tileCount = mix(uOuterLines, uInnerLines, vMask);
  float scaledY = blended.y * tileCount;
  float nY = smoothNoise(abs(scaledY));

  float ridge = pow(
    step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)),
    5.0
  );

  float lines = 0.0;
  for (float i = 1.0; i < 3.0; i += 1.0) {
    lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
  }

  float pattern = vMask * lines;

  float cycleT = fullT * uColorCycleSpeed;
  float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
  float gChannel = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
  float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);

  vec3 col = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`;

function initLineWaves() {
    const cfg = FX_CONFIG.lineWaves;

    // fixed full-screen holder behind everything (styled in theme.css)
    const holder = document.createElement("div");
    holder.className = "bg-fx";
    document.body.prepend(holder);

    const canvas = document.createElement("canvas");
    holder.appendChild(canvas);

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return; // very old browser -> just keep the plain black page

    // compile the two shaders and link them into a program
    function compileShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, LINE_WAVES_VERTEX));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, LINE_WAVES_FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);

    // one big triangle that covers the whole screen
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 0, 0,
         3, -1, 2, 0,
        -1,  3, 0, 2
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

    const uvLoc = gl.getAttribLocation(program, "uv");
    if (uvLoc !== -1) {
        gl.enableVertexAttribArray(uvLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);
    }

    // look up every uniform once
    const names = [
        "uTime", "uResolution", "uSpeed", "uInnerLines", "uOuterLines",
        "uWarpIntensity", "uRotation", "uEdgeFadeWidth", "uColorCycleSpeed",
        "uBrightness", "uColor1", "uColor2", "uColor3",
        "uMouse", "uMouseInfluence", "uEnableMouse"
    ];
    const u = {};
    for (const name of names) u[name] = gl.getUniformLocation(program, name);

    // push the CONFIG values into the shader
    gl.uniform1f(u.uSpeed, cfg.speed);
    gl.uniform1f(u.uInnerLines, cfg.innerLineCount);
    gl.uniform1f(u.uOuterLines, cfg.outerLineCount);
    gl.uniform1f(u.uWarpIntensity, cfg.warpIntensity);
    gl.uniform1f(u.uRotation, (cfg.rotation * Math.PI) / 180);
    gl.uniform1f(u.uEdgeFadeWidth, cfg.edgeFadeWidth);
    gl.uniform1f(u.uColorCycleSpeed, cfg.colorCycleSpeed);
    gl.uniform1f(u.uBrightness, cfg.brightness);
    gl.uniform3fv(u.uColor1, hexToVec3(cfg.color1));
    gl.uniform3fv(u.uColor2, hexToVec3(cfg.color2));
    gl.uniform3fv(u.uColor3, hexToVec3(cfg.color3));
    gl.uniform1f(u.uMouseInfluence, cfg.mouseInfluence);
    gl.uniform1i(u.uEnableMouse, cfg.enableMouseInteraction ? 1 : 0);
    gl.uniform2f(u.uMouse, 0.5, 0.5);

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform3f(u.uResolution, canvas.width, canvas.height, canvas.width / canvas.height);
    }
    window.addEventListener("resize", resize);
    resize();

    // smooth mouse follow (only used when enableMouseInteraction is true)
    let targetMouse = [0.5, 0.5];
    let currentMouse = [0.5, 0.5];

    if (cfg.enableMouseInteraction) {
        window.addEventListener("pointermove", function (e) {
            targetMouse = [
                e.clientX / window.innerWidth,
                1.0 - e.clientY / window.innerHeight
            ];
        });
    }

    function frame(time) {
        requestAnimationFrame(frame);

        gl.uniform1f(u.uTime, time * 0.001);

        if (cfg.enableMouseInteraction) {
            currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
            currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
            gl.uniform2f(u.uMouse, currentMouse[0], currentMouse[1]);
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
}

//                               specular buttons                               //

//          Tracks the cursor and lights up the rim of every          //
//          button/.btn that the cursor is close to.          //

(function () {
    let mouseX = -9999;
    let mouseY = -9999;
    let dirty = false;

    window.addEventListener("pointermove", function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dirty = true;
    });

    function tick() {
        requestAnimationFrame(tick);
        if (!dirty) return;
        dirty = false;

        const radius = FX_CONFIG.specularButton.radius;
        const buttons = document.querySelectorAll("button, .btn");

        for (const el of buttons) {
            const r = el.getBoundingClientRect();
            if (r.width === 0) continue;

            // distance from the cursor to the button edge
            const dx = Math.max(r.left - mouseX, 0, mouseX - r.right);
            const dy = Math.max(r.top - mouseY, 0, mouseY - r.bottom);
            const dist = Math.hypot(dx, dy);

            const t = Math.max(0, 1 - dist / radius);
            const glow = t * t * (3 - 2 * t); // smoothstep = nicer fade

            if (glow > 0.01) {
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                // angle from the button centre to the cursor (0deg = top, clockwise)
                const angle = Math.atan2(mouseX - cx, -(mouseY - cy)) * 180 / Math.PI;
                el.style.setProperty("--sb-angle", angle.toFixed(1) + "deg");
                el.style.setProperty("--sb-glow", glow.toFixed(3));
                el.__sbOn = true;
            } else if (el.__sbOn) {
                el.style.setProperty("--sb-glow", "0");
                el.__sbOn = false;
            }
        }
    }
    requestAnimationFrame(tick);
})();

//                               border glow cards                               //

//          Lights up the border of every .border-glow-card          //
//          on the side that faces the cursor.          //

document.addEventListener("pointermove", function (e) {
    const reach = FX_CONFIG.borderGlow.reach;
    const cards = document.querySelectorAll(".border-glow-card");

    for (const card of cards) {
        const r = card.getBoundingClientRect();
        if (r.width === 0) continue;

        // how far OUTSIDE the card the cursor is (0 = on/inside the card)
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const outside = Math.hypot(dx, dy);

        const proximity = Math.max(0, 1 - outside / reach);

        // angle from the card centre to the cursor (0deg = top, clockwise)
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const angle = Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180 / Math.PI;

        card.style.setProperty("--edge-proximity", (proximity * 100).toFixed(1));
        card.style.setProperty("--cursor-angle", angle.toFixed(1) + "deg");
    }
});

//                               dock desktop icons                               //

//          Admin dashboard icons magnify when the cursor is near,          //
//          like the macOS dock.          //

document.addEventListener("pointermove", function (e) {
    const tiles = document.querySelectorAll(".desktop-icon .icon-tile");

    for (const tile of tiles) {
        const r = tile.getBoundingClientRect();
        const dist = Math.hypot(
            e.clientX - (r.left + r.width / 2),
            e.clientY - (r.top + r.height / 2)
        );
        const t = Math.max(0, 1 - dist / FX_CONFIG.dock.range);
        tile.style.setProperty("--dock-scale", (1 + FX_CONFIG.dock.magnify * t).toFixed(3));
    }
});

//                               collapse toggler                               //

//          Tiny replacement for bootstrap's collapse JS so the          //
//          course chapter accordions still open/close.          //

document.addEventListener("click", function (e) {
    const trigger = e.target.closest('[data-bs-toggle="collapse"]');
    if (!trigger) return;

    const selector = trigger.getAttribute("data-bs-target") || trigger.getAttribute("href");
    if (!selector) return;

    const target = document.querySelector(selector);
    if (!target) return;

    e.preventDefault();
    target.classList.toggle("show");
    trigger.classList.toggle("collapsed");
});

//                               start background                               //

//          Line waves is the default background on EVERY page.          //

window.addEventListener("DOMContentLoaded", initLineWaves);
