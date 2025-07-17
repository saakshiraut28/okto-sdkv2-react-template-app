import React, { useState, useEffect, useContext } from "react";
import ApiRequestOverlay from "./ApiRequestOverlay";
import ApiResponseOverlay from "./ApiResponseOverlay";
import { ConfigContext } from "../context/ConfigContext";
import { subscribeApiLog, getApiLogHistory } from "../context/apiLogEmitter";

const getBaseAndPath = (url: string, baseUrl: string) => {
  if (!url) return { base: "", path: "" };
  if (url.startsWith(baseUrl)) {
    return { base: baseUrl, path: url.slice(baseUrl.length) };
  }
  if (url.startsWith("/")) {
    return { base: baseUrl, path: url };
  }
  try {
    const u = new URL(url);
    return { base: u.origin, path: u.pathname + u.search + u.hash };
  } catch {
    return { base: "", path: url };
  }
};

const ApiOverlayContainer: React.FC = () => {
  const { config } = useContext(ConfigContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"request" | "response">("request");
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);

  useEffect(() => {
    const unsub = subscribeApiLog((logsArr) => {
      setLogs(logsArr);
      setSelectedIdx(logsArr.length - 1);
    });
    setLogs(getApiLogHistory());
    setSelectedIdx(getApiLogHistory().length - 1);
    return () => unsub();
  }, []);

  if (config.mode !== "api") return null;
  const selectedLog = logs[selectedIdx] || { request: null, response: null };
  const { request, response } = selectedLog;

  return (
    <>
      {/* Inspect/View Logs Button */}
      <button
        className="fixed right-6 bottom-6 z-[9999] bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition"
        onClick={() => setDrawerOpen(true)}
        style={{ display: drawerOpen ? "none" : "block" }}
      >
        View API Logs
      </button>
      {/* Drawer Overlay */}
      <div
        className={`fixed inset-0 z-[10000] transition-all duration-300 ${drawerOpen ? "pointer-events-auto bg-black/30" : "pointer-events-none bg-transparent"}`}
        style={{ visibility: drawerOpen ? "visible" : "hidden" }}
        onClick={() => setDrawerOpen(false)}
      />
      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-[#181f2a] shadow-2xl z-[10001] transition-transform duration-300 flex flex-row ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ width: 700 }}
        aria-modal="true"
        role="dialog"
      >
        {/* Sidebar: Log List */}
        <div className="w-64 border-r border-[#2d3748] bg-[#1a2233] flex flex-col">
          <div className="px-4 py-3 font-bold text-slate-200 border-b border-[#2d3748]">
            API Logs
          </div>
          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 && (
              <div className="text-slate-400 p-4">No logs yet</div>
            )}
            {[...logs].reverse().map((log, idx) => {
              const origIdx = logs.length - 1 - idx;
              const { path } = log.request?.url
                ? getBaseAndPath(log.request.url, config.apiUrl)
                : { path: "-" };
              return (
                <button
                  key={log.timestamp}
                  className={`w-full text-left px-4 py-3 border-b border-[#232b3a] hover:bg-[#232b3a] transition-colors ${origIdx === selectedIdx ? "bg-[#232b3a] text-blue-400" : "text-slate-300"}`}
                  onClick={() => {
                    setSelectedIdx(origIdx);
                    setActiveTab("request");
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs">
                      {log.request?.method || "-"}
                    </span>
                    <span className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="truncate text-xs mt-1">{path}</div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Main Panel: Details */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3748]">
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-t font-semibold text-[15px] transition-colors ${activeTab === "request" ? "bg-[#232b3a] text-blue-400" : "bg-transparent text-slate-300"}`}
                onClick={() => setActiveTab("request")}
              >
                Request
              </button>
              <button
                className={`px-4 py-2 rounded-t font-semibold text-[15px] transition-colors ${activeTab === "response" ? "bg-[#232b3a] text-emerald-400" : "bg-transparent text-slate-300"}`}
                onClick={() => setActiveTab("response")}
              >
                Response
              </button>
            </div>
            <button
              className="text-slate-400 hover:text-white text-2xl font-bold ml-4"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeTab === "request" ? (
              <ApiRequestOverlay request={request} />
            ) : (
              <ApiResponseOverlay response={response} />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default ApiOverlayContainer;
