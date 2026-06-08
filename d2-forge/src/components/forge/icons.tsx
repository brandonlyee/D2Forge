import * as React from "react"

type IconProps = React.SVGProps<SVGSVGElement>

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

// Mirrored forge-wing emblem (brand mark).
const LOGO_PATH =
  "M212.62,11.18v289.4L12.63,45.19l0.42-0.62l97.69,63.35c0,0,24.86,15.96,25.98,17.08s2.04,2.24,2.11,5.67c0.07,3.43-1.56,17.49-0.99,23.54c0,0,0.79,12.53,4.62,19.71c3.82,7.19,6.66,14.64,22.81,24.46s26.84,8.97,27.03,8.97S180.64,49.03,180.64,49.03s-0.68-10.43-1.05-12.73s-1.36-5.19-4.15-6.95s-7.29-1.73-10.43-0.74s-5.74,3.49-7.34,7.12c-1.61,3.63-9.43,24.2-9.43,24.2l-0.75-0.88c0,0-0.48-0.49-0.61-0.83s-14.92-37.72-14.92-37.72s-1.5-3.74-0.55-5.74c0.95-2,2.78-3.26,10.66-3.49L212.62,11.18z M235.1,11.18v289.4L435.08,45.19l-0.42-0.62l-97.69,63.35c0,0-24.86,15.96-25.98,17.08s-2.04,2.24-2.11,5.67c-0.07,3.43,1.56,17.49,0.99,23.54c0,0-0.79,12.53-4.62,19.71c-3.82,7.19-6.66,14.64-22.81,24.46s-26.84,8.97-27.03,8.97s11.67-158.31,11.67-158.31s0.68-10.43,1.05-12.73s1.36-5.19,4.15-6.95c2.79-1.76,7.29-1.73,10.43-0.74s5.74,3.49,7.34,7.12c1.61,3.63,9.43,24.2,9.43,24.2l0.75-0.88c0,0,0.48-0.49,0.61-0.83c0.13-0.34,14.92-37.72,14.92-37.72s1.5-3.74,0.55-5.74c-0.95-2-2.78-3.26-10.66-3.49L235.1,11.18z"

export const Logo = (props: IconProps) => (
  <svg viewBox="0 0 445.85 307.78" fill="currentColor" {...props}>
    <path d={LOGO_PATH} />
  </svg>
)

export const Icon = {
  lock: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  info: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  chevron: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  check: (p: IconProps) => (
    <svg {...base} strokeWidth={2.4} {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  x: (p: IconProps) => (
    <svg {...base} strokeWidth={2.2} {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  clipboard: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  check2: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  alert: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  sun: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  moon: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  list: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  copy: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  trash: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  back: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  package: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  ),
}
