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
        "h-7 w-full rounded-sm flex items-center justify-center gap-1.5 px-2",
        "transition-all duration-200 active:scale-95",
        "border shrink-0",
        !danger && [
          "border-stone-200 bg-stone-50 text-stone-500",
          "hover:bg-stone-100 hover:border-stone-300 hover:text-stone-800",
        ],
        danger && [
          "border-rose-200 bg-stone-50 text-rose-400",
          "hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600",
        ],
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      <Icon size={13} strokeWidth={2.5} />
      <span className="text-[10px] font-semibold">{title}</span>
    </button>
  );
}
