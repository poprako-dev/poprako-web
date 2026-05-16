import React, { useState } from 'react';
import {
X,
BookOpen,
Hash,
Languages,
CheckSquare,
Eraser,
CloudUpload,
Download,
Trash2,
ChevronDown,
ChevronUp
} from 'lucide-react';

export default function App() {
return (
<div className="min-h-screen bg-[#EFEBE7] flex items-center justify-center p-8 font-sans">
{/_ 模态框主容器 - 整体淡褐色基调 _/}
<div className="w-full max-w-6xl bg-[#F7F3F0] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#DCD3CC] h-[800px]">

        {/* Header - 深木色营造重度层次感 */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#4A3B31] border-b border-[#3A2D24] shadow-inner">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-black text-[#E9E1D8] tracking-tight">Seed Comic</h1>

            {/* 章节选择器 - 适配木色背景 */}
            <div className="flex items-center bg-[#5D4E42] border border-[#3A2D24] rounded-lg overflow-hidden h-8">
              <span className="px-3 flex items-center justify-center font-bold text-[#A8988C] bg-[#3A2D24] h-full text-sm">
                #2
              </span>
              <span className="px-3 flex items-center justify-center font-bold text-[#F7F3F0] text-xs tracking-wider h-full cursor-pointer hover:bg-[#6D5D50] transition-colors">
                CHAPTER 1
                <ChevronDown className="w-4 h-4 ml-1 text-[#A8988C]" />
              </span>
            </div>
          </div>

          <button className="text-[#A8988C] hover:text-[#F7F3F0] transition-colors p-1 rounded-md hover:bg-white/10">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 主体内容区 */}
        <div className="flex flex-1 overflow-hidden">

          {/* 左侧边栏 - 保持布局，颜色适配淡褐色 */}
          <div className="w-[240px] flex-shrink-0 border-r border-[#DCD3CC] bg-[#F7F3F0] flex flex-col gap-6 p-5 overflow-y-auto">

            {/* 1. 封面预览区 */}
            <div className="flex justify-center group cursor-pointer relative">
               <div className="bg-[#EBE5E0] p-2 rounded-xl border border-[#DCD3CC] transition-all group-hover:shadow-md">
                 <div className="w-[140px] h-[200px] bg-[#DCD3CC] rounded-lg overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1578335359483-e1eb2dafb178?q=80&w=300&auto=format&fit=crop"
                      alt="Cover"
                      className="w-full h-full object-cover grayscale opacity-70 sepia-[.3]"
                    />
                 </div>
               </div>
            </div>

            {/* 2. 统计信息打组 (使用深一些的褐色，保持一致性) */}
            <div className="bg-[#EBE5E0] rounded-2xl p-4 flex flex-col gap-3.5 border border-[#DCD3CC]">
              <StatRow icon={<BookOpen className="w-4 h-4" />} label="总页数" value="1" />
              <StatRow icon={<Hash className="w-4 h-4" />} label="总单元数" value="5" />
              <StatRow icon={<Languages className="w-4 h-4" />} label="已翻译" value="4" />
              <StatRow icon={<CheckSquare className="w-4 h-4" />} label="已校对" value="5" />
            </div>

            {/* 3. 操作按钮打组 (保持紧凑布局) */}
            <div className="bg-[#E4DED8] rounded-2xl p-3 flex flex-col gap-2 mt-auto border border-[#DCD3CC]">
              <ActionButton icon={<Eraser className="w-4 h-4" />} />
              <ActionButton icon={<CloudUpload className="w-4 h-4" />} />
              <ActionButton icon={<Download className="w-4 h-4" />} />
              <ActionButton icon={<Trash2 className="w-4 h-4" />} danger />
            </div>

          </div>

          {/* 右侧主内容区 - 核心：营造凹陷感 (Inset Shadow) */}
          <div className="flex-1 bg-[#E4DED8] p-6 overflow-y-auto shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
             <div className="flex flex-wrap gap-6">
                {/* 页面卡片 */}
                <div className="relative bg-[#F7F3F0] p-2 rounded-xl border border-[#DCD3CC] shadow-sm hover:shadow-md transition-shadow">
                   <div className="absolute top-4 left-4 bg-[#4A3B31] text-[#E9E1D8] text-xs font-bold px-2 py-0.5 rounded-md z-10 shadow-sm">P1</div>
                   <div className="absolute top-4 right-4 w-4 h-4 bg-[#81A866] border-2 border-[#F7F3F0] rounded-full shadow-sm z-10"></div>
                   <div className="w-[180px] h-[260px] bg-[#DCD3CC] rounded-lg overflow-hidden">
                     <img
                        src="https://images.unsplash.com/photo-1578335359483-e1eb2dafb178?q=80&w=400&auto=format&fit=crop"
                        alt="Page"
                        className="w-full h-full object-cover grayscale opacity-80"
                      />
                   </div>
                   {/* 底部进度条 - 保持柔和色彩 */}
                   <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-[#DCD3CC] rounded-full overflow-hidden">
                      <div className="h-full bg-[#81A866] w-4/5 rounded-full"></div>
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* Footer 展开收起 - 适配淡褐色 */}
        <div className="h-8 bg-[#F7F3F0] border-t border-[#DCD3CC] flex justify-center items-center cursor-pointer hover:bg-[#EBE5E0] transition-colors">
           <ChevronUp className="w-5 h-5 text-[#A8988C]" />
        </div>

      </div>
    </div>

);
}

// 统计行组件
function StatRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
return (
<div className="flex items-center justify-between text-[13px]">
<div className="flex items-center gap-2 text-[#6D5D50] font-semibold">
<span className="text-[#81A866]">{icon}</span>
{label}
</div>
<div className="font-bold text-[#4A3B31] text-[14px]">{value}</div>
</div>
);
}

// 操作按钮组件
function ActionButton({ icon, danger = false }: { icon: React.ReactNode, danger?: boolean }) {
const baseClasses = "flex justify-center items-center w-full py-2.5 rounded-xl border transition-all duration-200 bg-[#F7F3F0]";
const defaultClasses = "border-[#DCD3CC] text-[#6D5D50] hover:text-[#4A3B31] hover:border-[#A8988C] hover:shadow-inner";
const dangerClasses = "border-transparent text-red-400 hover:text-red-700 hover:bg-[#FDF2F2] hover:border-red-200";

return (
<button className={`${baseClasses} ${danger ? dangerClasses : defaultClasses}`}>
{icon}
</button>
);
}
