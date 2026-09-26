const COLORS = ["#F97316", "#EF4444", "#8B5CF6", "#0EA5E9", "#10B981", "#EC4899", "#EAB308"];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function AvatarCircle({
  name,
  imageUrl,
  size = 40,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: colorFor(name || "?") }}
      className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white"
    >
      <span style={{ fontSize: size * 0.45 }}>{(name || "?").charAt(0).toUpperCase()}</span>
    </div>
  );
}
