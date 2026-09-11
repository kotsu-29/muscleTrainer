export default function PageHeader({
  title,
  subtitle,
  emoji,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <header className="px-5 pt-6 pb-2">
      <div className="flex items-center gap-2">
        {emoji && <span className="text-2xl">{emoji}</span>}
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="mt-1 text-sm font-medium text-[var(--foreground)]/60">{subtitle}</p>
      )}
    </header>
  );
}
