import { ExternalLink } from "lucide-react";

const acknowledgments = [
  { name: "电容", link: "https://github.com/influ3nza" },
  { name: "Pkuism", link: "https://github.com/pkuislm" },
  { name: "星辰大海", link: "https://github.com/SeaAndStars" },
  { name: "秋叶声生" },
];

export default function AcknowledgementsFooter() {
  return (
    <footer className="mt-8 w-full max-w-md text-center">
      <span className="text-xs tracking-wide text-slate-400">致谢</span>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
        {acknowledgments.map((p, i) => (
          <span key={p.name}>
            {p.link ? (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-slate-500 transition-colors hover:text-emerald-700 hover:underline"
              >
                {p.name}
                <ExternalLink size={9} className="opacity-60" />
              </a>
            ) : (
              <span className="font-medium text-slate-500">{p.name}</span>
            )}
            {i < acknowledgments.length - 1 && (
              <span className="select-none text-slate-300">·</span>
            )}
          </span>
        ))}
      </div>
    </footer>
  );
}
