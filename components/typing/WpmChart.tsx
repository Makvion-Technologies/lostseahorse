"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartMark, WpmSample } from "@/lib/runStats";

function sparseTicks(max: number, maxLabels = 4): number[] {
  if (max <= 0) return [0];
  const steps = [
    1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 120, 150, 200, 250, 300,
    400, 500, 600, 750, 1000, 1500, 2000, 3000, 3600, 7200, 10800,
  ];
  for (const step of steps) {
    const end = Math.ceil(max / step) * step;
    const count = Math.round(end / step) + 1;
    if (count > maxLabels) continue;
    const ticks: number[] = [];
    for (let value = 0; value <= end + 1e-9; value += step) {
      ticks.push(Number(value.toFixed(6)));
    }
    return ticks;
  }
  return [0, Number(max.toFixed(2))];
}

function formatAxisTime(seconds: number, span: number): string {
  const total = Math.max(0, Math.round(seconds));
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (span >= 3600) {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return `${hours}:${pad(minutes)}`;
  }
  if (span >= 60) {
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${minutes}:${pad(rest)}`;
  }
  return `${total}s`;
}

function valueAt(
  samples: WpmSample[],
  t: number,
  pick: (sample: WpmSample) => number,
): number {
  if (!samples.length) return 0;
  if (t <= samples[0]!.t) return pick(samples[0]!);
  for (let i = 1; i < samples.length; i++) {
    const next = samples[i]!;
    const prev = samples[i - 1]!;
    if (t <= next.t) {
      const span = next.t - prev.t || 1;
      const a = pick(prev);
      return Math.round(a + ((pick(next) - a) * (t - prev.t)) / span);
    }
  }
  return pick(samples[samples.length - 1]!);
}

const pickWpm = (sample: WpmSample) => sample.wpm;
const pickRaw = (sample: WpmSample) => sample.raw ?? sample.wpm;

function WordPreview({
  expected,
  typed,
  focus,
}: {
  expected: string;
  typed: string;
  focus?: number;
}) {
  return (
    <span className="font-mono text-lg tracking-wide">
      {expected.split("").map((exp, i) => {
        const got = typed[i];
        const color =
          got == null
            ? "text-muted/45"
            : got !== exp
              ? "text-coral"
              : "text-teal";
        return (
          <span
            key={i}
            className={
              focus === i
                ? `${color} underline decoration-2 underline-offset-4`
                : color
            }
          >
            {exp}
          </span>
        );
      })}
    </span>
  );
}

function curvePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export function WpmChart({
  samples,
  marks = [],
  ghostSamples,
}: {
  samples: WpmSample[];
  marks?: ChartMark[];
  /** A previous run drawn as a muted line for comparison. */
  ghostSamples?: WpmSample[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 720, h: 220 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const w = Math.max(200, Math.round(entry.contentRect.width));
      const h = Math.max(90, Math.round(entry.contentRect.height));
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [hover, setHover] = useState<{
    t: number;
    wpm: number;
    raw: number | null;
    prev: number | null;
    x: number;
    y: number;
    mark: ChartMark | null;
  } | null>(null);

  if (samples.length < 2) {
    return (
      <p className="flex h-full items-center text-sm text-muted">
        Type a little longer to see a WPM curve.
      </p>
    );
  }

  const width = size.w;
  const height = size.h;
  const axisFont = width >= 640 ? 14 : 12;
  const left = axisFont * 2 + 34;
  const right = 20;
  const top = Math.ceil(axisFont / 2) + 4;
  const bottom = axisFont * 2 + 16;
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const ghost = ghostSamples && ghostSamples.length >= 2 ? ghostSamples : null;
  const hasRaw = samples.every((sample) => typeof sample.raw === "number");
  const peak = Math.max(
    1,
    ...samples.map((sample) => (hasRaw ? pickRaw(sample) : sample.wpm)),
    ...(ghost ? ghost.map((sample) => sample.wpm) : []),
  );
  const yTicks = sparseTicks(peak);
  const yMax = yTicks[yTicks.length - 1] ?? peak;
  const maxT = Math.max(
    0.001,
    samples[samples.length - 1]?.t ?? 1,
    ghost ? (ghost[ghost.length - 1]?.t ?? 0) : 0,
  );
  const xTicks = sparseTicks(maxT).filter((tick) => tick <= maxT + 1e-6);

  const xOf = (t: number) => left + (t / maxT) * plotW;
  const yOf = (wpm: number) => top + plotH - (wpm / yMax) * plotH;

  const pts = samples.map((sample) => ({
    x: xOf(sample.t),
    y: yOf(sample.wpm),
  }));
  const line = curvePath(pts);
  const rawLine = hasRaw
    ? curvePath(
        samples.map((sample) => ({ x: xOf(sample.t), y: yOf(pickRaw(sample)) })),
      )
    : "";
  const ghostLine = ghost
    ? curvePath(ghost.map((sample) => ({ x: xOf(sample.t), y: yOf(sample.wpm) })))
    : "";
  const area = `${line} L ${xOf(maxT)} ${yOf(0)} L ${xOf(0)} ${yOf(0)} Z`;

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(ctm.inverse());
    const t = Math.min(maxT, Math.max(0, ((local.x - left) / plotW) * maxT));
    const wpm = valueAt(samples, t, pickWpm);
    const raw = hasRaw ? valueAt(samples, t, pickRaw) : null;
    const prev = ghost ? valueAt(ghost, t, pickWpm) : null;
    const hoverX = xOf(t);
    let nearest: ChartMark | null = null;
    let best = 3;
    for (const mark of marks) {
      const d = Math.abs(xOf(mark.t) - hoverX);
      if (d <= best) {
        best = d;
        nearest = mark;
      }
    }
    setHover({ t, wpm, raw, prev, x: hoverX, y: yOf(wpm), mark: nearest });
  };

  return (
    <div ref={boxRef} className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full cursor-crosshair"
        role="img"
        aria-label="WPM over time"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setHover(null);
        }}
        style={{ touchAction: "pan-y" }}
      >
        {yTicks.map((tick) => (
          <text
            key={`y-${tick}`}
            x={left - 8}
            y={yOf(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="var(--muted)"
            fontSize={axisFont}
            fontFamily="var(--font-sans)"
          >
            {tick}
          </text>
        ))}
        {xTicks.map((tick) => (
          <text
            key={`x-${tick}`}
            x={xOf(tick)}
            y={top + plotH + axisFont + 6}
            textAnchor="middle"
            fill="var(--muted)"
            fontSize={axisFont}
            fontFamily="var(--font-sans)"
          >
            {formatAxisTime(tick, maxT)}
          </text>
        ))}
        <line
          x1={left}
          x2={left}
          y1={top}
          y2={top + plotH}
          stroke="var(--muted)"
          strokeWidth="1.2"
          opacity="0.45"
        />
        <line
          x1={left}
          x2={left + plotW}
          y1={top + plotH}
          y2={top + plotH}
          stroke="var(--muted)"
          strokeWidth="1.2"
          opacity="0.45"
        />
        <text
          x={axisFont}
          y={top + plotH / 2}
          fill="var(--muted)"
          fontSize={axisFont}
          fontFamily="var(--font-sans)"
          letterSpacing="0.12em"
          textAnchor="middle"
          transform={`rotate(-90 ${axisFont} ${top + plotH / 2})`}
        >
          WPM
        </text>
        <text
          x={left + plotW / 2}
          y={height - 3}
          fill="var(--muted)"
          fontSize={axisFont}
          fontFamily="var(--font-sans)"
          letterSpacing="0.12em"
          textAnchor="middle"
        >
          Time
        </text>
        <path
          d={area}
          fill="color-mix(in srgb, var(--teal) 14%, transparent)"
          stroke="none"
        />
        {ghostLine ? (
          <path
            d={ghostLine}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.55"
          />
        ) : null}
        {rawLine ? (
          <path
            d={rawLine}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="1.6"
            strokeDasharray="4 4"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.7"
          />
        ) : null}
        <path
          d={line}
          fill="none"
          stroke="var(--teal)"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hover ? (
          <g>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={top}
              y2={hover.y}
              stroke="var(--teal)"
              strokeWidth="0.7"
              opacity="0.7"
            />
            <line
              x1={hover.x}
              x2={hover.x}
              y1={hover.y}
              y2={top + plotH}
              stroke="var(--teal)"
              strokeWidth="0.7"
              strokeDasharray="3 4"
              opacity="0.55"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="4.5"
              fill="var(--abyss)"
              stroke="var(--teal)"
              strokeWidth="2"
            />
          </g>
        ) : null}
        {marks.map((mark, i) => {
          const x = xOf(mark.t);
          const y = yOf(Math.min(yMax, Math.max(0, mark.wpm)));
          const color =
            mark.kind === "missed" ? "var(--amber)" : "var(--coral)";
          return (
            <g key={`${mark.kind}-${mark.t}-${i}`}>
              <line
                x1={x}
                x2={x}
                y1={y}
                y2={top + plotH}
                stroke={color}
                strokeWidth="1"
                opacity="0.55"
              />
              <circle
                cx={x}
                cy={y}
                r="2.5"
                fill={color}
                stroke="var(--abyss)"
                strokeWidth="0.8"
              />
            </g>
          );
        })}
      </svg>
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-none whitespace-nowrap rounded-xl border border-line bg-card px-3 py-2 text-sm shadow-[0_16px_40px_-24px_rgba(0,0,0,0.5)]"
          style={{
            left: `${(hover.x / width) * 100}%`,
            top: 8,
            transform:
              hover.x / width > 0.82
                ? "translateX(calc(-100% - 10px))"
                : "translateX(-50%)",
          }}
        >
          <p className="text-muted">
            {formatAxisTime(hover.t, maxT)} ·{" "}
            <span className="text-teal">{hover.wpm} wpm</span>
            {hover.raw !== null ? (
              <>
                {" · "}
                <span>{hover.raw} raw</span>
              </>
            ) : null}
            {hover.prev !== null ? (
              <>
                {" · "}
                <span>{hover.prev} prev</span>
              </>
            ) : null}
          </p>
          {hover.mark ? (
            <p className="mt-1">
              <WordPreview
                expected={hover.mark.expected}
                typed={hover.mark.typed}
                focus={hover.mark.at}
              />
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
