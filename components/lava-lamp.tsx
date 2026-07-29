export function LavaLamp() {
  return (
    <div className="lava-lamp" aria-hidden="true">
      <svg className="absolute size-0" focusable="false">
        <filter id="lava-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>
      <div className="lava-lamp__field">
        <span className="lava-blob lava-blob-a" />
        <span className="lava-blob lava-blob-b" />
        <span className="lava-blob lava-blob-c" />
        <span className="lava-blob lava-blob-d" />
        <span className="lava-blob lava-blob-e" />
      </div>
    </div>
  );
}
