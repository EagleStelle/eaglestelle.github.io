import Image from "next/image";
import { initials } from "@/lib/utils";

const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);
const NUMERALS = Array.from({ length: 12 }, (_, index) => index * 30);

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
        <path d="M200 50 207 66H193Z" fill="currentColor" />
      </svg>

      <div className="absolute inset-[22%] overflow-hidden rounded-full border border-border bg-tint">
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
