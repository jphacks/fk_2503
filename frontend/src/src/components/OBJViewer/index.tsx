import { useEffect, useRef, useState } from "react";

type Vec3 = [number, number, number];

interface OBJData {
  vertices: Vec3[];
  faces: number[][]; // indices (0-based)
}

function parseOBJ(text: string): OBJData {
  const vertices: Vec3[] = [];
  const faces: number[][] = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === 'v' && parts.length >= 4) {
      vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (parts[0] === 'f' && parts.length >= 4) {
      const idxs = parts.slice(1).map(tok => {
        const a = tok.split('/')[0];
        const i = parseInt(a, 10);
        return (isNaN(i) ? 1 : i) - 1; // OBJ is 1-based
      });
      faces.push(idxs);
    }
  }
  return { vertices, faces };
}

function fitToUnit(vertices: Vec3[]): { verts: Vec3[]; scale: number; center: Vec3 } {
  if (vertices.length === 0) return { verts: [], scale: 1, center: [0,0,0] };
  let min: Vec3 = [Infinity, Infinity, Infinity];
  let max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const [x,y,z] of vertices) {
    if (x < min[0]) min[0] = x; if (y < min[1]) min[1] = y; if (z < min[2]) min[2] = z;
    if (x > max[0]) max[0] = x; if (y > max[1]) max[1] = y; if (z > max[2]) max[2] = z;
  }
  const cx = (min[0] + max[0]) / 2;
  const cy = (min[1] + max[1]) / 2;
  const cz = (min[2] + max[2]) / 2;
  const sx = max[0] - min[0];
  const sy = max[1] - min[1];
  const sz = max[2] - min[2];
  const size = Math.max(sx, sy, sz) || 1;
  const scale = 1 / size; // normalize to ~1
  const verts = vertices.map(([x,y,z]) => [(x - cx) * scale, (y - cy) * scale, (z - cz) * scale]);
  return { verts, scale, center: [cx, cy, cz] };
}

function rotateY([x,y,z]: Vec3, a: number): Vec3 {
  const ca = Math.cos(a), sa = Math.sin(a);
  return [x*ca + z*sa, y, -x*sa + z*ca];
}
function rotateX([x,y,z]: Vec3, a: number): Vec3 {
  const ca = Math.cos(a), sa = Math.sin(a);
  return [x, y*ca - z*sa, y*sa + z*ca];
}

function project([x,y,z]: Vec3, fov: number, aspect: number, dist=2): [number, number] {
  const f = 1/Math.tan((fov*Math.PI/180)/2);
  const Z = z - dist; // shift back slightly
  const px = (x * f / aspect) / -Z;
  const py = (y * f) / -Z;
  return [px, py];
}

interface OBJViewerProps {
  src: string;
  wireColor?: string;
  bgColor?: string;
  className?: string;
  autoRotate?: boolean;
}

export default function OBJViewer({ src, wireColor = '#222', bgColor = 'transparent', className = '', autoRotate = true }: OBJViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<OBJData | null>(null);
  const [normVerts, setNormVerts] = useState<Vec3[]>([]);
  const [drag, setDrag] = useState<{down: boolean; x: number; y: number}>({down:false, x:0, y:0});
  const [rot, setRot] = useState<{rx: number; ry: number}>({rx: -0.3, ry: 0.6});

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then(r => r.text())
      .then(t => { if (!cancelled) { const parsed = parseOBJ(t); setData(parsed); const { verts } = fitToUnit(parsed.vertices); setNormVerts(verts); }})
      .catch(() => {});
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.clientWidth; const h = canvas.clientHeight; const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.floor(w*dpr) || canvas.height !== Math.floor(h*dpr)) {
        canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr);
      }
      ctx.setTransform(1,0,0,1,0,0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0,0,w,h);
      if (bgColor !== 'transparent') { ctx.fillStyle = bgColor; ctx.fillRect(0,0,w,h); }

      // rotation
      if (autoRotate && !drag.down) setRot(r => ({ rx: r.rx, ry: r.ry + 0.01 }));
      const verts = normVerts.map(v => rotateX(rotateY(v, rot.ry), rot.rx));

      // project
      const aspect = w / h;
      const points = verts.map(v => project(v, 50, aspect, 2.5));

      // to screen
      const toScreen = (p:[number,number]):[number,number] => [ (p[0]*0.45 + 0.5) * w, (-p[1]*0.45 + 0.5) * h ];
      ctx.lineWidth = 1.2; ctx.strokeStyle = wireColor; ctx.beginPath();
      for (const face of data.faces) {
        if (face.length < 2) continue;
        const [sx, sy] = toScreen(points[face[0]]);
        ctx.moveTo(sx, sy);
        for (let i=1;i<face.length;i++) {
          const [x,y] = toScreen(points[face[i]]);
          ctx.lineTo(x,y);
        }
        // close face
        const [ex,ey] = toScreen(points[face[0]]);
        ctx.lineTo(ex,ey);
      }
      ctx.stroke();

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [data, normVerts, wireColor, bgColor, autoRotate, drag.down, rot]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onDown = (e: MouseEvent) => setDrag({down:true, x:e.clientX, y:e.clientY});
    const onUp = () => setDrag(d => ({...d, down:false}));
    const onMove = (e: MouseEvent) => setRot(r => drag.down ? ({ rx: r.rx + (e.clientY-drag.y)*0.005, ry: r.ry + (e.clientX-drag.x)*0.005 }) : r);
    c.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => { c.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); window.removeEventListener('mousemove', onMove); };
  }, [drag.down, drag.x, drag.y]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block rounded-md" />
      {!data && (
        <div className="absolute inset-0 grid place-items-center text-xs text-neutral-500">Loading OBJ…</div>
      )}
    </div>
  );
}

