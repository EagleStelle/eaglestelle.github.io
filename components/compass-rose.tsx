import Image from "next/image";
import { initials } from "@/lib/utils";

const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);
const NUMERALS = Array.from({ length: 12 }, (_, index) => index * 30);
const CARDINALS = [90, 180, 270];
const DIAGONALS = [45, 135, 225, 315];

function RoseArm({
  degree,
  tip,
  half,
  shade,
  light,
}: {
  degree: number;
  tip: number;
  half: number;
  shade: number;
  light: number;
}) {
  const transform = `rotate(${degree} 200 200)`;

  return (
    <g transform={transform}>
      <path d={`M200 ${tip} 200 104 ${200 - half} 104Z`} fill="currentColor" fillOpacity={shade} />
      <path d={`M200 ${tip} 200 104 ${200 + half} 104Z`} fill="currentColor" fillOpacity={light} />
    </g>
  );
}

export function CompassRose({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name: string;
}) {
  return (
    <div className="relative aspect-square w-full">
      <svg
        viewBox="0 0 400 400"
        aria-hidden="true"
        focusable="false"
        className="compass-dial absolute inset-0 size-full text-primary"
      >
        <defs>
          <radialGradient id="stellaron-core">
            <stop offset="0.7" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="0.76" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="url(#stellaron-core)"
          className="opacity-55 dark:opacity-100"
        />
        <circle cx="200" cy="200" r="197" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle
          cx="200"
          cy="200"
          r="146"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 5"
          opacity="0.6"
        />
        {TICKS.map((degree) => {
          const major = degree % 30 === 0;
          const length = major ? 18 : degree % 10 === 0 ? 11 : 6;

          return (
            <line
              key={degree}
              x1="200"
              y1="4"
              x2="200"
              y2={4 + length}
              stroke="currentColor"
              strokeWidth={major ? 2 : 1}
              transform={`rotate(${degree} 200 200)`}
            />
          );
        })}
        {NUMERALS.map((degree) => (
          <text
            key={degree}
            x="200"
            y="42"
            textAnchor="middle"
            fill="currentColor"
            className="compass-numeral"
            transform={`rotate(${degree} 200 200)`}
          >
            {degree / 10}
          </text>
        ))}
        {DIAGONALS.map((degree) => (
          <RoseArm key={degree} degree={degree} tip={70} half={7} shade={0.5} light={0.16} />
        ))}
        {CARDINALS.map((degree) => (
          <RoseArm key={degree} degree={degree} tip={54} half={10} shade={0.9} light={0.28} />
        ))}
        <RoseArm degree={0} tip={50} half={10} shade={1} light={1} />
      </svg>

      <div className="absolute inset-[22%] overflow-hidden rounded-full border border-primary/40 bg-tint">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 17rem, (min-width: 640px) 11rem, 9rem"
            className="object-cover"
          />
        ) : (
          <span
            role="img"
            aria-label={name}
            className="type-wide flex size-full items-center justify-center text-[clamp(1.5rem,4vw,3rem)] font-bold text-primary"
          >
            {initials(name)}
          </span>
        )}
      </div>
    </div>
  );
}
