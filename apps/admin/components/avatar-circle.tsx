const COLORS = ["#4F46E5", "#0EA5E9", "#059669", "#DB2777", "#D97706", "#7C3AED"];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function AvatarCircle({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, backgroundColor: colorFor(name || "?") }}
      className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white"
    >
      <span style={{ fontSize: size * 0.45 }}>{(name || "?").charAt(0).toUpperCase()}</span>
    </div>
  );
}
