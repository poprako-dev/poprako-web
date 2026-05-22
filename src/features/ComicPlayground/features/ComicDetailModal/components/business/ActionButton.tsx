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
        "shrink-0 relative",
        "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
        "after:h-[2px] after:w-[60%] after:transition-all after:duration-200",
        "hover:after:w-[80%]",
        !danger && [
          "bg-stone-50 text-stone-400",
          "hover:text-stone-700",
          "after:bg-stone-300",
        ],
        danger && [
          "bg-stone-50 text-rose-300",
          "hover:text-rose-500",
          "after:bg-rose-300",
        ],
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      <Icon size={13} strokeWidth={2.5} />
      <span className="text-[10px] font-semibold">{title}</span>
    </button>
  );
}
