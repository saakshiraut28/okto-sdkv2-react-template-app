import React from "react";

const Pill = (text: string, colorClass = "bg-emerald-600") => (
  <span
    className={`inline-block px-3 py-0.5 rounded-full text-white font-semibold text-[13px] mr-2 mb-2 border-0 tracking-wide ${colorClass}`}
  >
    {text}
  </span>
);

const ApiResponseOverlay: React.FC<{ response: any }> = ({ response }) => {
  if (!response)
    return <div className="text-slate-300 text-[14px]">No response yet</div>;
  return (
    <div className="font-sans text-slate-50">
      <div className="flex gap-2 mb-2 flex-wrap">
        {Pill(`Status: ${response.status}`)}
      </div>
      <div className="text-[13px] text-slate-300 font-semibold mt-[14px] mb-1 tracking-wide">
        Body
      </div>
      <pre className="bg-[#181f2a] border border-[#2d3748] rounded p-2 text-[13px] m-0 text-slate-50 font-mono overflow-x-auto">
        {JSON.stringify(response.body, null, 2)}
      </pre>
    </div>
  );
};
export default ApiResponseOverlay;
