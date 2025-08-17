import * as React from "react";

type Importer<P> = () => Promise<{ default: React.ComponentType<P> }>;

interface LazyClientOptions {
  fallback?: React.ReactNode;
  ssrFallback?: React.ReactNode;
}

export function lazyClient<P>(
  importer: Importer<P>,
  options?: LazyClientOptions
): React.FC<P> & { preload: () => void } {
  const Lazy = React.lazy(importer);
  const isServer = typeof window === "undefined";

  const Wrapped: React.FC<P> & { preload: () => void } = ((props: P) => {
    if (isServer) {
      // On the server, render an SSR-friendly fallback to avoid hydration mismatch
      return <>{options?.ssrFallback ?? null}</>;
    }
    const Comp = Lazy as unknown as React.ComponentType<any>;
    return (
      <React.Suspense fallback={options?.fallback ?? null}>
        <Comp {...(props as any)} />
      </React.Suspense>
    );
  }) as React.FC<P> & { preload: () => void };

  Wrapped.preload = () => {
    // fire-and-forget import to warm the chunk
    void importer();
  };

  return Wrapped;
}
