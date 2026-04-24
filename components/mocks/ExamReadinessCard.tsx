"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  pct: number;
  mocksCompleted: number;
  goalPct: number;
  goalTarget: number;
  trendPoints: { score: number; at: string }[];
}

/**
 * Exam Readiness card — matches the reference mockup. Interactive:
 * donut animates from 0 on mount, trend chart has a hover crosshair +
 * tooltip, "View trend" arrow nudges on hover.
 */
export default function ExamReadinessCard({
  pct,
  mocksCompleted,
  goalPct,
  goalTarget,
  trendPoints,
}: Props) {
  return (
    <div className="rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="font-poppins font-semibold text-base text-neutral-900">
            Exam Readiness
          </h2>
          <InfoIcon className="w-3.5 h-3.5 text-neutral-400" />
        </div>
        <Link
          href="/mocks/history"
          className="group text-sm font-medium text-info hover:underline inline-flex items-center gap-1"
        >
          View trend
          <span
            aria-hidden
            className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>

      {/* Donut + trend (side by side, generous space) */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="flex flex-col items-center">
          <Donut pct={pct} />
          <div className="mt-2.5 flex items-center gap-1">
            <p className="text-xs text-neutral-500">Readiness Score</p>
            <InfoIcon className="w-3 h-3 text-neutral-400" />
          </div>
        </div>
        <TrendChart points={trendPoints} currentPct={pct} />
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-neutral-100" />

      {/* Footer stats — vertical divider between the two */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-neutral-100">
        <div className="flex items-center gap-3 pr-5">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-neutral-50 border border-neutral-100 text-neutral-500 flex-shrink-0">
            <ClipboardIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-poppins font-bold text-2xl text-neutral-900 leading-none">
              {mocksCompleted}
            </p>
            <p className="text-xs text-neutral-500 mt-1.5">mocks completed</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pl-5">
          <div className="flex-shrink-0">
            <p className="font-poppins font-bold text-2xl text-neutral-900 leading-none">
              {goalPct}%
            </p>
            <p
              className="text-xs text-neutral-500 mt-1.5 whitespace-nowrap"
              title={`${goalTarget}% readiness goal`}
            >
              of goal completed
            </p>
          </div>
          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden self-center">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Donut with mount-in animation ────────────────────────────────────────

function Donut({ pct }: { pct: number }) {
  const size = 124;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = Math.max(0, Math.min(100, pct));

  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    // Animate from 0 on mount for a lightweight load-in
    const t = requestAnimationFrame(() => setDisplayed(target));
    return () => cancelAnimationFrame(t);
  }, [target]);

  const offset = c - (displayed / 100) * c;

  return (
    <div
      className="relative group"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transition-transform duration-300 group-hover:scale-[1.02]"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-neutral-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          className="text-info"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-poppins font-bold text-[32px] text-neutral-900 leading-none">
          {Math.round(displayed)}
          <span className="text-lg font-semibold text-neutral-500 ml-0.5">
            %
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Interactive trend chart ──────────────────────────────────────────────

function TrendChart({
  points,
  currentPct,
}: {
  points: { score: number; at: string }[];
  currentPct: number;
}) {
  const width = 420;
  const height = 170;
  const padL = 36;
  const padR = 44;
  const padT = 14;
  const padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center text-xs text-neutral-400 rounded-md border border-dashed border-neutral-200 bg-neutral-50/40 px-4"
        style={{ width: "100%", minHeight: height }}
      >
        <p>Not enough trend data yet</p>
        <p className="mt-1 text-[11px] text-neutral-400/80 text-center">
          Complete another mock to see your trend
        </p>
      </div>
    );
  }

  const coords = points.map((p, i) => {
    const x = padL + (innerW * i) / (points.length - 1);
    const y =
      padT + innerH - (Math.max(0, Math.min(100, p.score)) / 100) * innerH;
    return [x, y, p] as const;
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  const last = coords[coords.length - 1];

  const yGrid = [0, 50, 100];
  const tickCount = Math.min(points.length, 5);
  const tickIdxs =
    tickCount === points.length
      ? points.map((_, i) => i)
      : Array.from({ length: tickCount }, (_, k) =>
          Math.round((k * (points.length - 1)) / (tickCount - 1))
        );

  const formatTick = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    // find nearest point index
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = Math.abs(coords[i][0] - relX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setHover(best);
  }

  const hovered = hover != null ? coords[hover] : null;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        aria-label="Readiness trend over time"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#145A79" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#145A79" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yGrid.map((v) => {
          const y = padT + innerH - (v / 100) * innerH;
          return (
            <g key={v}>
              <line
                x1={padL}
                x2={padL + innerW}
                y1={y}
                y2={y}
                stroke="#F1F1EF"
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#8A8A8A"
              >
                {v}%
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#trendFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#145A79"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 4"
        />

        {/* Points */}
        {coords.map(([x, y], i) => {
          const isLast = i === coords.length - 1;
          const isHover = hover === i;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isHover ? 5 : isLast ? 3.5 : 2.5}
              fill="#145A79"
              stroke="white"
              strokeWidth={isHover ? 2.5 : isLast ? 2 : 1.5}
              style={{ transition: "r 150ms ease" }}
            />
          );
        })}

        {/* Crosshair while hovering */}
        {hovered && (
          <line
            x1={hovered[0]}
            x2={hovered[0]}
            y1={padT}
            y2={padT + innerH}
            stroke="#145A79"
            strokeOpacity="0.25"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}

        {/* X-axis labels */}
        {tickIdxs.map((i) => {
          const [x] = coords[i];
          return (
            <text
              key={i}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#8A8A8A"
            >
              {formatTick(points[i].at)}
            </text>
          );
        })}

        {/* End-point callout pill (hidden when hovering over a point) */}
        {!hovered && (
          <g transform={`translate(${last[0] + 8}, ${last[1] - 10})`}>
            <rect x="0" y="0" width="42" height="20" rx="4" fill="#0F2A3A" />
            <text
              x="21"
              y="14"
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="white"
            >
              {Math.round(currentPct)}%
            </text>
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded-md bg-[#0F2A3A] text-white shadow-md text-[11px] whitespace-nowrap transition-opacity duration-150"
          style={{
            left: `${(hovered[0] / width) * 100}%`,
            top: `${((hovered[1] - 8) / height) * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="font-semibold leading-none">
            {Math.round(hovered[2].score)}%
          </p>
          <p className="text-white/70 text-[10px] mt-0.5 leading-none">
            {formatTick(hovered[2].at)}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────

function InfoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ClipboardIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" />
      <rect x="4" y="5" width="16" height="17" rx="2" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  );
}
