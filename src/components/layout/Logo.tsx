/** VisionGuard mark: a shield with an eye. Same drawing as src/app/icon.svg (the browser tab icon). */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="VisionGuard">
      <rect width="64" height="64" rx="15" fill="#1a56db" />
      <path
        d="M32 9.5 51 16.5 V30.5 C51 43 42.8 51.6 32 55 21.2 51.6 13 43 13 30.5 V16.5 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4.2"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 32.5 C23.4 26.4 27.5 24 32 24 S40.6 26.4 44.5 32.5 C40.6 38.6 36.5 41 32 41 S23.4 38.6 19.5 32.5 Z"
        fill="#ffffff"
      />
      <circle cx="32" cy="32.5" r="5.2" fill="#1a56db" />
      <circle cx="33.8" cy="30.7" r="1.6" fill="#ffffff" />
    </svg>
  );
}
