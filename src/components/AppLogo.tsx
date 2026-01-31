interface AppLogoProps {
  className?: string;
  size?: number;
}

export default function AppLogo({ className = "", size = 44 }: AppLogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-xl drop-shadow-sm"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          fill="var(--color-primary)"
          className="drop-shadow-sm"
        />
        <path d="M8 10h6v12H8V10z" fill="var(--color-accent)" />
        <path d="M18 10h6v12h-6V10z" fill="var(--color-soft-blue)" />
      </svg>
    </div>
  );
}
