import clsx from "clsx";

type Props = {
  icon: React.ElementType;
  title: string;
  onClick?: () => void;
};

export default function ActionButton({ icon: Icon, title, onClick }: Props) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={clsx(
        "h-6 w-full rounded-sm flex items-center justify-center",
        "transition-all duration-200 active:scale-95",
        "border border-slate-200 bg-white text-slate-500",
        "hover:border-slate-400 hover:text-slate-800 shrink-0",
      )}
    >
      <Icon size={14} strokeWidth={2.5} />
    </button>
  );
}
