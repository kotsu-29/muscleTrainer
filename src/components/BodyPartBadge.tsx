export default function BodyPartBadge({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full font-bold text-white " +
        (size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs")
      }
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}
