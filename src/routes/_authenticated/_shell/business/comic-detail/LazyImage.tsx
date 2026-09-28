import { type JSX, useEffect, useRef, useState } from "react";
import clsx from "clsx";

type Props = {
  src: string;
  alt?: string | undefined;
  className?: string | undefined;
  placeholderClassName?: string | undefined;
};

export function LazyImage({ src, alt = "", className, placeholderClassName }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }
        const isVisible = entry.isIntersecting;
        setVisible(isVisible);
        if (!isVisible) {
          setLoaded(false);
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.05,
      },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={clsx("relative overflow-hidden", className)}>
      {!loaded && (
        <div
          className={clsx("absolute inset-0 bg-slate-100 animate-pulse", placeholderClassName)}
        />
      )}
      {visible && (
        <img
          src={src}
          alt={alt}
          decoding="async"
          onLoad={() => {
            setLoaded(true);
          }}
          className={clsx(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
