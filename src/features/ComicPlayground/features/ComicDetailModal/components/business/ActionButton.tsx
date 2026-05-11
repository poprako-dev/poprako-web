import clsx from "clsx";

type Props = {
  icon: React.ElementType;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
};

export default function ActionButton({
  icon: Icon,
  title,
  onClick,
  disabled,
  danger,
}: Props) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "h-6 w-full rounded-sm flex items-center justify-center",
        "transition-all duration-200 active:scale-95",
        "border shrink-0",
        !danger && "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800",
        danger && "border-rose-200 bg-white text-rose-400 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      <Icon size={14} strokeWidth={2.5} />
    </button>
  );
}
