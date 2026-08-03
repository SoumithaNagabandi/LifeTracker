interface FlowerDecorProps {
  className?: string;
}

function Daisy({
  className,
  petal = '#FFFDF5',
  center = '#F5C542',
  centerRing = '#F0A020',
}: {
  className: string;
  petal?: string;
  center?: string;
  centerRing?: string;
}) {
  const petals = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30;
    return (
      <ellipse
        key={i}
        cx="40"
        cy="18"
        rx="7"
        ry="15"
        fill={petal}
        opacity="0.95"
        transform={`rotate(${angle} 40 40)`}
        stroke="rgba(255, 250, 230, 0.9)"
        strokeWidth="0.4"
      />
    );
  });

  return (
    <svg className={`flower ${className}`} viewBox="0 0 80 80" fill="none">
      {petals}
      <circle cx="40" cy="40" r="11" fill={centerRing} opacity="0.55" />
      <circle cx="40" cy="40" r="8.5" fill={center} />
      <circle cx="40" cy="40" r="3.2" fill="#FFE9A0" opacity="0.85" />
    </svg>
  );
}

export function FlowerDecor({ className = '' }: FlowerDecorProps) {
  return (
    <div className={`flower-field ${className}`} aria-hidden="true">
      <Daisy className="f1" petal="#FFFDF7" center="#F6C93A" centerRing="#E8A820" />
      <Daisy className="f2" petal="#FFF9E8" center="#FFCF4A" centerRing="#F0B020" />
      <Daisy className="f3" petal="#FFFEFA" center="#F2BE2E" centerRing="#E09A18" />
      <Daisy className="f4" petal="#FFF8E0" center="#FFD45C" centerRing="#F0B040" />
      <Daisy className="f5" petal="#FFFFFF" center="#F5C842" centerRing="#E8A828" />
      <Daisy className="f6" petal="#FFFBEA" center="#FFCC40" centerRing="#E8A010" />
    </div>
  );
}
