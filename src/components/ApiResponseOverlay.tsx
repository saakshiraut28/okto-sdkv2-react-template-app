import React, { useEffect, useState } from "react";
import { subscribeApiLog, getApiLog } from "../context/apiLogEmitter";

const FIXED_HEIGHT = 320;
const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`transition-transform duration-200 ml-1 inline-block align-middle w-[18px] h-[18px] ${open ? "rotate-180" : "rotate-0"}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const Pill = (text: string, colorClass = "bg-emerald-600") => (
  <span
    className={`inline-block px-3 py-0.5 rounded-full text-white font-semibold text-[13px] mr-2 mb-2 border-0 tracking-wide ${colorClass}`}
  >
    {text}
  </span>
);

const ApiResponseOverlay: React.FC = () => {
  const [response, setResponse] = useState<any>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setResponse(getApiLog().response);
    return subscribeApiLog((_: any, res: any) => setResponse(res));
  }, []);
  return (
    <div
      className="bg-[#181f2a] rounded-[10px] border border-[#2d3748] min-w-[340px] max-w-[420px] mb-4 font-sans text-slate-50 flex flex-col"
      style={{ maxHeight: 320 }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-none border-none outline-none flex items-center justify-between px-[18px] py-[13px] font-semibold text-[15px] text-slate-50 rounded-[10px] cursor-pointer"
        aria-expanded={open}
        type="button"
      >
        <span>RESPONSE</span>
        <Chevron open={open} />
      </button>
      <div
        className={`transition-[max-height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-[#181f2a] rounded-b-[10px] border-t border-[#2d3748] flex-1 ${open ? "overflow-auto" : "overflow-hidden"} max-h-[264px]`}
      >
        {open && (
          <div className="pt-4 px-[18px] pb-3">
            {response ? (
              <>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {Pill(`Status: ${response.status}`)}
                </div>
                <div className="text-[13px] text-slate-300 font-semibold mt-[14px] mb-1 tracking-wide">
                  Body
                </div>
                <pre className="bg-[#181f2a] border border-[#2d3748] rounded p-2 text-[13px] m-0 text-slate-50 font-mono overflow-x-auto">
                  {JSON.stringify(response.body, null, 2)}
                </pre>
              </>
            ) : (
              <div className="text-slate-300 text-[14px]">No response yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ApiResponseOverlay;
