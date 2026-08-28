export function Card({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-background p-6">
      <h3 className="font-display text-lg font-semibold text-accent">{title}</h3>
      <div className="mt-4 flex-1">{children}</div>
      {footer && <div className="mt-5 border-t border-line pt-4">{footer}</div>}
    </div>
  );
}