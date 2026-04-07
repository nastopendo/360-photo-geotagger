import { useEffect, useRef } from 'react'

// ── GLSL ──────────────────────────────────────────────────────────────────────

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

// Correct rotation order for a first-person viewer:
//   1. pitch around LOCAL camera X axis (applied first to ray)
//   2. yaw   around WORLD Y axis (applied second)
// This prevents gimbal coupling: dragging horizontally always pans horizontally,
// dragging vertically always tilts vertically, at any yaw angle.
const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_fov;
uniform float u_aspect;
varying vec2 v_uv;
const float PI = 3.14159265358979;

void main() {
  vec2 ndc = v_uv * 2.0 - 1.0;
  float scale = tan(u_fov * 0.5);

  // Camera-space ray
  vec3 dir = normalize(vec3(ndc.x * u_aspect * scale, ndc.y * scale, 1.0));

  // 1. Pitch (rotate around camera X axis)
  float cp = cos(u_pitch), sp = sin(u_pitch);
  dir = vec3(dir.x, cp*dir.y - sp*dir.z, sp*dir.y + cp*dir.z);

  // 2. Yaw (rotate around world Y axis)
  float cy = cos(u_yaw), sy = sin(u_yaw);
  dir = vec3(cy*dir.x + sy*dir.z, dir.y, -sy*dir.x + cy*dir.z);

  // Equirectangular lookup
  float lon = atan(dir.x, dir.z) / (2.0 * PI) + 0.5;
  float lat = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;

  // CLAMP_TO_EDGE on both axes (required for NPOT textures in WebGL 1)
  gl_FragColor = texture2D(u_tex, clamp(vec2(lon, 1.0 - lat), 0.0, 1.0));
}
`

// Fixed internal canvas resolution — never changed, so WebGL context is stable.
// CSS stretches this to the container; u_aspect is updated to the display ratio.
const W = 1024
const H = 512

interface Props { url: string; className?: string }

export function Panorama360({ url, className }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const camRef     = useRef({ yaw: 0, pitch: 0, fov: Math.PI / 2 })
  const dragRef    = useRef({ active: false, lastX: 0, lastY: 0 })
  // Aspect ratio updated by ResizeObserver without touching the canvas size
  const aspectRef  = useRef(W / H)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const glRaw = canvas.getContext('webgl', { antialias: true })
    if (!glRaw) { console.error('[Panorama360] WebGL not available'); return }
    const gl = glRaw

    // ── Compile shaders ───────────────────────────────────────────────────
    function compile(type: number, src: string) {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.error('[Panorama360] shader:', gl.getShaderInfoLog(sh))
      return sh
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.error('[Panorama360] link:', gl.getProgramInfoLog(prog))
    gl.useProgram(prog)

    // ── Quad geometry ─────────────────────────────────────────────────────
    const vbo = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uYaw    = gl.getUniformLocation(prog, 'u_yaw')!
    const uPitch  = gl.getUniformLocation(prog, 'u_pitch')!
    const uFov    = gl.getUniformLocation(prog, 'u_fov')!
    const uAspect = gl.getUniformLocation(prog, 'u_aspect')!

    // ── Texture ───────────────────────────────────────────────────────────
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    // 2×2 grey placeholder — LINEAR filter so no mipmaps needed, CLAMP for NPOT safety
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, new Uint8Array([80,80,80,255, 80,80,80,255, 80,80,80,255, 80,80,80,255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    let alive = true

    const img = new Image()
    img.onload = () => {
      if (!alive) return
      const maxSz = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
      let src: CanvasImageSource = img
      if (img.naturalWidth > maxSz || img.naturalHeight > maxSz) {
        const s  = Math.min(maxSz / img.naturalWidth, maxSz / img.naturalHeight)
        const oc = document.createElement('canvas')
        oc.width = Math.floor(img.naturalWidth * s)
        oc.height = Math.floor(img.naturalHeight * s)
        oc.getContext('2d')!.drawImage(img, 0, 0, oc.width, oc.height)
        src = oc
      }
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }
    img.onerror = () => console.error('[Panorama360] image load failed')
    img.src = url

    // ── ResizeObserver — update aspect ratio without touching canvas size ─
    const wrapper = wrapperRef.current
    const ro = wrapper ? new ResizeObserver(() => {
      const { offsetWidth: w, offsetHeight: h } = wrapper
      if (w > 0 && h > 0) aspectRef.current = w / h
    }) : null
    if (wrapper && ro) ro.observe(wrapper)

    // ── Render loop ───────────────────────────────────────────────────────
    gl.viewport(0, 0, W, H)
    gl.clearColor(0.08, 0.08, 0.08, 1)

    let raf = 0
    function render() {
      if (!alive) return
      raf = requestAnimationFrame(render)
      gl.clear(gl.COLOR_BUFFER_BIT)
      const { yaw, pitch, fov } = camRef.current
      gl.uniform1f(uYaw, yaw)
      gl.uniform1f(uPitch, pitch)
      gl.uniform1f(uFov, fov)
      gl.uniform1f(uAspect, aspectRef.current)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    render()

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [url])

  // ── Pointer handling ──────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.clientX - d.lastX
    const dy = e.clientY - d.lastY
    d.lastX = e.clientX
    d.lastY = e.clientY
    // Drag right → higher yaw → see right side of panorama (Street View convention)
    camRef.current.yaw  -= dx * 0.005
    // Drag up (dy < 0) → pitch decreases → looks upward
    camRef.current.pitch = Math.max(-Math.PI / 2.1,
      Math.min(Math.PI / 2.1, camRef.current.pitch - dy * 0.005))
  }
  function onPointerUp() { dragRef.current.active = false }

  // Wheel: non-passive to allow preventDefault
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      camRef.current.fov = Math.max(0.4,
        Math.min(Math.PI * 0.75, camRef.current.fov + e.deltaY * 0.001))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden bg-gray-950 ${className ?? ''}`}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: '100%', display: 'block' }}
        className="cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    </div>
  )
}
