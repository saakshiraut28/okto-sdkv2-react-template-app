import React from "react";

const Pill = (text: string, colorClass = "bg-blue-600") => (
  <span
    className={`inline-block px-3 py-0.5 rounded-full text-white font-semibold text-[13px] mr-2 mb-2 border-0 tracking-wide ${colorClass}`}
  >
    {text}
  </span>
);

const ApiRequestOverlay: React.FC<{ request: any }> = ({ request }) => {
  if (!request)
    return <div className="text-slate-300 text-[14px]">No request yet</div>;
  return (
    <div className="font-sans text-slate-50">
      <div className="flex gap-2 mb-2 flex-wrap">
        {Pill(request.method)}
        {Pill(request.url, "bg-[#2d3748]")}
      </div>
      <div className="text-[13px] text-slate-300 font-semibold mt-[14px] mb-1 tracking-wide">
        Headers
      </div>
      <pre className="bg-[#181f2a] border border-[#2d3748] rounded p-2 text-[13px] m-0 text-slate-50 font-mono whitespace-pre-wrap break-all">
        {JSON.stringify(request.headers, null, 2)}
      </pre>
      {request.body && (
        <>
          <div className="text-[13px] text-slate-300 font-semibold mt-[14px] mb-1 tracking-wide">
            Request Body
          </div>
          <pre className="bg-[#181f2a] border border-[#2d3748] rounded p-2 text-[13px] m-0 text-slate-50 font-mono overflow-x-auto">
            {JSON.stringify(request.body, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
};
export default ApiRequestOverlay;
