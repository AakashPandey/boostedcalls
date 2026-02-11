"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ChartPoint {
  x: number;
  y: number;
  label: string;
}

interface LineChartProps {
  title: string;
  subtitle: string;
  badge?: string;
  points: ChartPoint[];
  yAxisLabel?: string;
}

export function LineChart({
  title,
  subtitle,
  badge = "Last 14 days",
  points,
  yAxisLabel = "Performance",
}: LineChartProps) {
  const reduceMotion = useReducedMotion();

  const chartWidth = 368;
  const chartHeight = 118;
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  const minX = xValues.length ? Math.min(...xValues) : 0;
  const maxX = xValues.length ? Math.max(...xValues) : 1;
  const minY = yValues.length ? Math.min(...yValues) : 0;
  const maxY = yValues.length ? Math.max(...yValues) : 1;
  const xRange = Math.max(maxX - minX, 1);
  const yRangeBase = Math.max(maxY - minY, 1);
  const yPadding = yRangeBase * 0.1;
  const yMin = minY - yPadding;
  const yMax = maxY + yPadding;
  const yRange = Math.max(yMax - yMin, 1);

  const scaleX = (x: number) => ((x - minX) / xRange) * chartWidth;
  const scaleY = (y: number) => chartHeight - ((y - yMin) / yRange) * chartHeight;

  const scaledPoints = points.map((p) => ({
    ...p,
    sx: scaleX(p.x),
    sy: scaleY(p.y),
  }));

  // Generate path data from points
  const pathData = scaledPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.sx} ${p.sy}`)
    .join(" ");
  const fillPath = scaledPoints.length
    ? `${pathData} L ${scaledPoints[scaledPoints.length - 1].sx} ${chartHeight} L ${scaledPoints[0].sx} ${chartHeight} Z`
    : "";

  const gridlines = [0.25, 0.5, 0.75].map((t) => t * chartHeight);
  
  // Generate smart y-axis tick values based on data range
  const generateYAxisTicks = () => {
    const range = yMax - yMin;
    const tickValues = [];
    
    // Determine appropriate tick interval
    let interval = 1;
    if (range <= 0.5) {
      interval = 0.1;
    } else if (range <= 2) {
      interval = 0.5;
    } else if (range <= 5) {
      interval = 1;
    } else if (range <= 10) {
      interval = 2;
    } else if (range <= 50) {
      interval = 10;
    } else {
      interval = Math.ceil(range / 5);
    }
    
    // Generate tick values from bottom to top
    const startValue = Math.floor(yMin / interval) * interval;
    for (let val = startValue; val <= yMax; val += interval) {
      if (val >= yMin && val <= yMax) {
        const yPos = scaleY(val);
        // Only show integer values to avoid fractional call counts
        if (Number.isInteger(val) || Math.abs(val - Math.round(val)) < 0.01) {
          tickValues.push({ y: yPos, value: Math.round(val) });
        }
      }
    }
    
    return tickValues.length ? tickValues : [
      { y: scaleY(yMin), value: Math.round(yMin) },
      { y: scaleY(yMax), value: Math.round(yMax) },
    ];
  };
  
  const yAxisTicks = generateYAxisTicks();

  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-1">
        <div>
          <p className="text-xl font-semibold text-zinc-800 dark:text-zinc-400">{title}</p>
          {/* <p className="text-2xl font-semibold tracking-tight">{subtitle}</p> */}
        </div>
        <div className="rounded-full border border-black/10 px-3 py-1 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-400">
          {badge}
        </div>
      </div>

      {/* Chart area with padding */}
      <div className="relative mt-2 -ml-4 h-44 px-5 md:px-6 pb-8">
        <svg
          viewBox="0 0 440 160"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full text-zinc-900 dark:text-zinc-50"
        >
          <defs>
            <linearGradient id="successLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="successFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Group with left + top padding */}
          <g transform="translate(36, 12)">
            {/* Gridlines */}
            {gridlines.map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
            ))}

            {/* Axes */}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={chartHeight}
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1={chartHeight}
              x2={chartWidth}
              y2={chartHeight}
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="1"
            />

            {/* Y-axis labels – right-aligned, outside the chart area */}
            {yAxisTicks.map((tick) => (
              <text
                key={tick.y}
                x="-12"
                y={tick.y + 4}
                fontSize="10"
                fill="currentColor"
                opacity="0.5"
                textAnchor="end"
              >
                {tick.value}
              </text>
            ))}

            {/* X-axis labels */}
            {scaledPoints.map((point, index) => (
              <text
                key={`label-${index}`}
                x={point.sx}
                y={chartHeight + 14}
                fontSize="10"
                fill="currentColor"
                opacity="0.5"
                textAnchor="middle"
              >
                {point.label}
              </text>
            ))}

            {/* Area fill */}
            {fillPath && <path d={fillPath} fill="url(#successFill)" />}

            {/* Line glow / background */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.18"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Main animated line */}
            <motion.path
              d={pathData}
              fill="none"
              stroke="url(#successLine)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0.4 }}
              animate={reduceMotion ? false : { pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
            />

            {/* Data points */}
            {scaledPoints.map((point, index) => (
              <circle
                key={`point-${index}`}
                cx={point.sx}
                cy={point.sy}
                r="4"
                fill="currentColor"
                opacity="0.9"
                stroke="white"
                strokeWidth="1.5"
                className="dark:stroke-zinc-950"
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}