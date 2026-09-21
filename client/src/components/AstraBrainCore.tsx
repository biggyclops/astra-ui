import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
}

interface Edge {
  from: string;
  to: string;
}

interface MicroNode {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

const NODES: Node[] = [
  { id: 'mini-beast', label: 'Mini-Beast', x: 0, y: -180, r: 22 },
  { id: 'hades', label: 'Hades', x: 200, y: -90, r: 20 },
  { id: 'atlas', label: 'Atlas', x: -200, y: -90, r: 20 },
  { id: 'hermes', label: 'Hermes', x: 0, y: 200, r: 20 },
  { id: 'phobos', label: 'Phobos', x: 150, y: 120, r: 18 },
  { id: 'autonomy', label: 'Autonomy', x: -150, y: 120, r: 18 },
  { id: 'media', label: 'Media', x: 90, y: -200, r: 17 },
  { id: 'jobs', label: 'Jobs', x: -90, y: -200, r: 17 },
];

const EDGES: Edge[] = [
  { from: 'mini-beast', to: 'hades' },
  { from: 'mini-beast', to: 'atlas' },
  { from: 'mini-beast', to: 'hermes' },
  { from: 'hades', to: 'phobos' },
  { from: 'atlas', to: 'autonomy' },
  { from: 'hermes', to: 'media' },
  { from: 'hermes', to: 'jobs' },
];

// Generate dense micro-nodes in circular brain field
const generateMicroNodes = (count: number): MicroNode[] => {
  const nodes: MicroNode[] = [];
  const centerR = 280;
  
  for (let i = 0; i < count; i++) {
    // Bias toward circular distribution with some clustering
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const radius = Math.pow(Math.random(), 0.6) * centerR;
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 40;
    const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 40;
    const r = 1.2 + Math.random() * 2.2;
    const alpha = 0.25 + Math.random() * 0.55;
    nodes.push({ x, y, r, alpha });
  }
  return nodes;
};

const MICRO_NODES: MicroNode[] = generateMicroNodes(118);

const CENTER = { x: 0, y: 0 };

export default function AstraBrainCore() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getNodeById = (id: string) => NODES.find(n => n.id === id)!;

  const getConnected = (nodeId: string) => {
    return EDGES
      .filter(e => e.from === nodeId || e.to === nodeId)
      .map(e => e.from === nodeId ? e.to : e.from);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.88 : 1.14;
    const newScale = Math.max(0.35, Math.min(4.5, transform.scale * delta));
    setTransform(t => ({ ...t, scale: newScale }));
  }, [transform.scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'circle' || (e.target as HTMLElement).tagName === 'text') {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(t => ({
      ...t,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (id: string) => {
    setSelected(selected === id ? null : id);
  };

  const recenter = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelected(null);
  };

  const viewBoxSize = 620;
  const viewBox = `${-viewBoxSize / 2} ${-viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`;

  const connectedNodes = selected ? getConnected(selected) : [];

  return (
    <div className="relative w-full h-[620px] bg-[#05070f] rounded-3xl border border-white/10 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[3px] text-cyan-400/80">ASTRA SYSTEM MAP</div>
          <div className="font-mono text-[9px] text-amber-400/60">PREVIEW MODE • LIVE WIRING PENDING</div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 px-3 py-1 text-[10px] font-mono tracking-[2px] border border-amber-500/40 rounded-full text-amber-400/80 bg-amber-950/30">
        PREVIEW
      </div>

      <button
        onClick={recenter}
        className="absolute top-4 right-20 z-10 px-3 py-1 text-[10px] font-mono tracking-widest border border-white/20 rounded-full hover:bg-white/5 text-cyan-300/70"
      >
        RECENTER
      </button>

      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={viewBox}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g
          transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}
        >
          <defs>
            {/* Strong cyan/teal glow filters */}
            <filter id="glowCyan" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glowStrong" x="-300%" y="-300%" width="700%" height="700%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glowMicro" x="-400%" y="-400%" width="900%" height="900%">
              <feGaussianBlur stdDeviation="1.8" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Subtle orbit rings */}
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(103,232,249,0.035)" strokeWidth="1"/>
            </pattern>
          </defs>

          {/* Large circular brain field background */}
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="295"
            fill="none"
            stroke="rgba(103,232,249,0.06)"
            strokeWidth="1.5"
          />
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="240"
            fill="none"
            stroke="rgba(103,232,249,0.035)"
            strokeWidth="1"
          />
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="175"
            fill="none"
            stroke="rgba(103,232,249,0.025)"
            strokeWidth="1"
          />

          {/* Grid */}
          <rect x="-340" y="-340" width="680" height="680" fill="url(#grid)" />

          {/* Faint micro-links between nearby micro-nodes */}
          {MICRO_NODES.slice(0, 42).map((n, i) => {
            const near = MICRO_NODES.slice(i + 1).find(m =>
              Math.hypot(m.x - n.x, m.y - n.y) < 58
            );
            if (!near) return null;
            return (
              <line
                key={`ml-${i}`}
                x1={n.x}
                y1={n.y}
                x2={near.x}
                y2={near.y}
                stroke="rgba(103,232,249,0.09)"
                strokeWidth="0.6"
              />
            );
          })}

          {/* Main structural edges (faint) */}
          {EDGES.map((edge, i) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            const isActive = selected && (connectedNodes.includes(edge.from) || connectedNodes.includes(edge.to));
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isActive ? "#67e8f9" : "rgba(103,232,249,0.18)"}
                strokeWidth={isActive ? 2.4 : 1.1}
                strokeOpacity={isActive ? 0.95 : 0.45}
              />
            );
          })}

          {/* Micro nodes - dense glowing field */}
          {MICRO_NODES.map((node, i) => (
            <circle
              key={`micro-${i}`}
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill="#67e8f9"
              opacity={node.alpha}
              filter="url(#glowMicro)"
            />
          ))}

          {/* Main labeled nodes */}
          {NODES.map((node) => {
            const isSelected = selected === node.id;
            const isConnected = connectedNodes.includes(node.id);
            const glow = isSelected || isConnected;

            return (
              <g key={node.id} onClick={() => handleNodeClick(node.id)} className="cursor-pointer">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r + 4}
                  fill="none"
                  stroke={glow ? "#67e8f9" : "rgba(103,232,249,0.2)"}
                  strokeWidth={glow ? 1.5 : 0.8}
                  opacity={glow ? 0.6 : 0.3}
                  filter={glow ? "url(#glowCyan)" : undefined}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill="#05070f"
                  stroke={isSelected ? "#67e8f9" : isConnected ? "#67e8f9" : "#67e8f960"}
                  strokeWidth={isSelected ? 3.5 : 2}
                  filter={glow ? "url(#glowStrong)" : undefined}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r - 5}
                  fill="none"
                  stroke="#67e8f940"
                  strokeWidth="1.2"
                />
                <text
                  x={node.x}
                  y={node.y + node.r + 20}
                  textAnchor="middle"
                  fill="#67e8f9"
                  fontSize="12.5"
                  fontFamily="monospace"
                  letterSpacing="1.8"
                  opacity={glow ? 1 : 0.75}
                  fontWeight={glow ? "600" : "400"}
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* Central Astra Core - larger, brighter, embedded */}
          <g>
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="52"
              fill="#05070f"
              stroke="#67e8f9"
              strokeWidth="2"
              strokeOpacity="0.85"
              filter="url(#glowStrong)"
            />
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="42"
              fill="none"
              stroke="#67e8f930"
              strokeWidth="2"
            />
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="32"
              fill="none"
              stroke="#67e8f920"
              strokeWidth="1.5"
            />
            <text
              x={CENTER.x}
              y={CENTER.y + 6}
              textAnchor="middle"
              fill="#67e8f9"
              fontSize="15"
              fontFamily="monospace"
              letterSpacing="4"
              fontWeight="700"
              filter="url(#glowCyan)"
            >
              ASTRA
            </text>
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="8"
              fill="#67e8f9"
              opacity="0.9"
              filter="url(#glowStrong)"
            />
          </g>
        </g>
      </svg>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[2px] text-white/35">
        DRAG TO PAN • SCROLL TO ZOOM • CLICK NODE TO HIGHLIGHT
      </div>
    </div>
  );
}
