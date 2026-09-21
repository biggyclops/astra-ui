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

const NODES: Node[] = [
  { id: 'mini-beast', label: 'Mini-Beast', x: 0, y: -120, r: 18 },
  { id: 'hades', label: 'Hades', x: 140, y: -60, r: 16 },
  { id: 'atlas', label: 'Atlas', x: -140, y: -60, r: 16 },
  { id: 'hermes', label: 'Hermes', x: 0, y: 140, r: 16 },
  { id: 'phobos', label: 'Phobos', x: 100, y: 80, r: 14 },
  { id: 'autonomy', label: 'Autonomy', x: -100, y: 80, r: 14 },
  { id: 'media', label: 'Media', x: 60, y: -140, r: 13 },
  { id: 'jobs', label: 'Jobs', x: -60, y: -140, r: 13 },
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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.4, Math.min(3, transform.scale * delta));
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

  const viewBoxSize = 420;
  const viewBox = `${-viewBoxSize / 2} ${-viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`;

  const connectedNodes = selected ? getConnected(selected) : [];

  return (
    <div className="relative w-full h-[520px] bg-[#05070f] rounded-3xl border border-white/10 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[3px] text-cyan-400/80">ASTRA SYSTEM MAP</div>
          <div className="font-mono text-[9px] text-amber-400/60">PREVIEW MODE • LIVE WIRING PENDING</div>
        </div>
      </div>

      <button
        onClick={recenter}
        className="absolute top-4 right-4 z-10 px-3 py-1 text-[10px] font-mono tracking-widest border border-white/20 rounded-full hover:bg-white/5 text-cyan-300/70"
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
          {/* Background subtle grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(103,232,249,0.06)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect x="-300" y="-300" width="600" height="600" fill="url(#grid)" />

          {/* Edges */}
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
                stroke={isActive ? "#67e8f9" : "#67e8f920"}
                strokeWidth={isActive ? 2.2 : 1.2}
                strokeOpacity={isActive ? 0.9 : 0.35}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const isSelected = selected === node.id;
            const isConnected = connectedNodes.includes(node.id);
            const glow = isSelected || isConnected;

            return (
              <g key={node.id} onClick={() => handleNodeClick(node.id)} className="cursor-pointer">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={glow ? "#0a192f" : "#0a192f"}
                  stroke={isSelected ? "#67e8f9" : isConnected ? "#67e8f980" : "#67e8f930"}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r - 3}
                  fill="none"
                  stroke={glow ? "#67e8f950" : "#67e8f920"}
                  strokeWidth="1"
                />
                <text
                  x={node.x}
                  y={node.y + node.r + 16}
                  textAnchor="middle"
                  fill="#67e8f9"
                  fontSize="11"
                  fontFamily="monospace"
                  letterSpacing="1.5"
                  opacity={glow ? 1 : 0.7}
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* Central Astra Core */}
          <g>
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="38"
              fill="#05070f"
              stroke="#67e8f9"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="28"
              fill="none"
              stroke="#67e8f930"
              strokeWidth="1"
            />
            <text
              x={CENTER.x}
              y={CENTER.y + 5}
              textAnchor="middle"
              fill="#67e8f9"
              fontSize="13"
              fontFamily="monospace"
              letterSpacing="3"
              fontWeight="600"
            >
              ASTRA
            </text>
          </g>
        </g>
      </svg>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[2px] text-white/40">
        DRAG TO PAN • SCROLL TO ZOOM • CLICK NODE TO HIGHLIGHT
      </div>
    </div>
  );
}
