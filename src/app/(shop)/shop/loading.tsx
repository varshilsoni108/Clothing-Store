export default function ShopLoading() {
  return (
    <div className="container-store py-10">
      <div className="h-9 w-32 animate-pulse rounded bg-accent-soft" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-accent-soft" />
      <div className="mt-8 flex gap-8">
        <div className="hidden w-60 space-y-6 lg:block">
          <div className="h-4 w-16 animate-pulse rounded bg-accent-soft" />
          <div className="h-8 w-full animate-pulse rounded-full bg-accent-soft" />
          <div className="h-8 w-full animate-pulse rounded-full bg-accent-soft" />
          <div className="h-4 w-16 animate-pulse rounded bg-accent-soft" />
          <div className="h-8 w-full animate-pulse rounded bg-accent-soft" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5] animate-pulse rounded-2xl bg-accent-soft" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-accent-soft" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-accent-soft" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}