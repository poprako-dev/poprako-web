import { useSpecialChars } from "@/hook/useSpecialChars";

type Props = {
  onInsert: (char: string) => void;
};

export default function SpecialCharsBar({ onInsert }: Props) {
  const { specialChars } = useSpecialChars();

  return (
    <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
      {specialChars.map((char, index) => (
        <button
          key={index}
          onMouseDown={(e) => {
            e.preventDefault(); // 阻止焦点转移
            onInsert(char);
          }}
          className="px-1.5 py-0.5 text-[12px] bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-500 rounded border border-gray-200 hover:border-(--color-border-green-200) transition-colors font-mono min-w-6 text-center"
        >
          {char}
        </button>
      ))}
    </div>
  );
}
