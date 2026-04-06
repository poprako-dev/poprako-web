import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
};

export default function LazyImage({
  src,
  alt = "",
  className,
  placeholderClassName,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={clsx("relative overflow-hidden", className)}>
      {!loaded && (
        <div
          className={clsx(
            "absolute inset-0 bg-slate-100 animate-pulse",
            placeholderClassName,
          )}
        />
      )}
      {visible && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={clsx(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
