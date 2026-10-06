import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec3 uInk;
  uniform vec3 uDeep;
  uniform vec3 uRed;
  uniform vec3 uPink;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = rotation * p * 2.03 + 17.17;
      amplitude *= 0.50;
    }
    return value;
  }

  vec2 stagePoint() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 point = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 pointer = (uPointer - 0.5) * vec2(aspect, 1.0);
    vec2 delta = point - pointer;
    point += normalize(delta + vec2(0.0001)) * 0.045 * exp(-dot(delta, delta) * 3.2);
    return point;
  }

  float vignette(vec2 uv) {
    vec2 edge = smoothstep(vec2(0.02), vec2(0.42), uv * (1.0 - uv));
    return edge.x * edge.y;
  }

  void main() {
    vec2 point = stagePoint();
    float time = uTime * 0.075;
    vec2 firstWarp = vec2(
      fbm(point * 1.12 + vec2(time * 0.16, -time * 0.09)),
      fbm(point * 1.08 + vec2(5.2, -3.1) + vec2(-time * 0.10, time * 0.12))
    );
    vec2 secondWarp = vec2(
      fbm(point * 0.92 + firstWarp * 1.55 + vec2(8.3, time * 0.08)),
      fbm(point * 1.04 + firstWarp * 1.28 + vec2(-4.4, -time * 0.11))
    );
    float sweep = point.y * 1.15 + point.x * 0.40;
    float bend = sin((sweep + secondWarp.x * 0.72) * 3.15 + time * 0.30);
    float counter = sin((point.y * 0.62 - point.x * 0.92 + secondWarp.y * 0.66) * 2.75 - time * 0.22);
    float broadLight = smoothstep(-0.82, 0.72, bend);
    float pinkLift = smoothstep(0.18, 0.96, counter + secondWarp.x * 0.34);
    float silk = 1.0 - smoothstep(0.12, 0.68, abs(counter - 0.18));
    float depth = fbm(point * 1.30 + secondWarp * 0.84 + time * 0.025);
    vec3 color = mix(uInk, uDeep, 0.58 + depth * 0.42);
    color = mix(color, uRed, broadLight * (0.78 + depth * 0.22));
    color = mix(color, uPink, pinkLift * broadLight * 0.52);
    color = mix(color, uPink, silk * broadLight * 0.18);
    color += uRed * smoothstep(0.62, 1.0, depth) * 0.30;
    color += uRed * broadLight * 0.10;
    float grain = hash21(gl_FragCoord.xy + uTime * 0.17) - 0.5;
    color += grain * 0.012;
    color *= mix(0.63, 1.0, vignette(vUv));
    gl_FragColor = vec4(color, 1.0);
  }
`

export function AmbientField() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: 'high-performance' })
    } catch {
      return
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor('#17090A', 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35))
    renderer.domElement.className = 'absolute inset-0 h-full w-full'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      uTime: { value: reducedMotion ? 8 : 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uInk: { value: new THREE.Color('#17090A') },
      uDeep: { value: new THREE.Color('#8C2226') },
      uRed: { value: new THREE.Color('#EB3F43') },
      uPink: { value: new THREE.Color('#F5BAC5') },
    }
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })
    scene.add(new THREE.Mesh(geometry, material))

    const pointerTarget = new THREE.Vector2(0.5, 0.5)
    const pointerCurrent = new THREE.Vector2(0.5, 0.5)
    let animationFrame = 0
    let pageVisible = document.visibilityState === 'visible'
    let visible = true

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      const width = Math.max(1, Math.round(bounds.width))
      const height = Math.max(1, Math.round(bounds.height))
      renderer.setSize(width, height, false)
      uniforms.uResolution.value.set(width, height)
      renderer.render(scene, camera)
    }
    const onPointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect()
      pointerTarget.set(
        THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
        THREE.MathUtils.clamp(1 - (event.clientY - bounds.top) / bounds.height, 0, 1),
      )
    }
    const renderFrame = (time: number) => {
      if (pageVisible && visible) {
        uniforms.uTime.value = reducedMotion ? 8 : time * 0.001
        pointerCurrent.lerp(pointerTarget, 0.028)
        uniforms.uPointer.value.copy(pointerCurrent)
        renderer.render(scene, camera)
      }
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(renderFrame)
    }
    const onVisibilityChange = () => {
      pageVisible = document.visibilityState === 'visible'
    }
    const resizeObserver = new ResizeObserver(resize)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })

    resizeObserver.observe(container)
    intersectionObserver.observe(container)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    resize()
    renderFrame(0)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0d0c0d]" aria-hidden="true">
      <div className="absolute inset-0 scale-105 bg-[radial-gradient(circle_at_16%_22%,#EB3F43_0%,transparent_35%),radial-gradient(circle_at_82%_68%,#7A2B2E_0%,transparent_42%),radial-gradient(circle_at_62%_12%,#F5BAC5_0%,transparent_31%),#0D0C0D] blur-[28px] saturate-[1.08]" />
    </div>
  )
}
