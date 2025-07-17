type ApiRequest = {
  method: "GET" | "POST";
  url: string;
  headers: Record<string, string>;
  body?: any;
};

type ApiResponse = {
  status?: number;
  body?: any;
};

  type ApiLogEntry = {
  request: ApiRequest | null;
  response: ApiResponse | null;
  timestamp: number;
};

type Listener = (logs: ApiLogEntry[], latest: ApiLogEntry) => void;

let logs: ApiLogEntry[] = [];
const listeners: Listener[] = [];

function notifyListeners() {
  const latest = logs[logs.length - 1] || {
    request: null,
    response: null,
    timestamp: Date.now(),
  };
  listeners.forEach((l) => l([...logs], latest));
}

export function addApiLogRequest(req: ApiRequest) {
  logs.push({ request: req, response: null, timestamp: Date.now() });
  notifyListeners();
}

export function addApiLogResponse(res: ApiResponse) {
  if (logs.length === 0) {
    logs.push({ request: null, response: res, timestamp: Date.now() });
  } else {
    logs[logs.length - 1] = {
      ...logs[logs.length - 1],
      response: res,
    };
  }
  notifyListeners();
}

export function subscribeApiLog(listener: Listener) {
  listeners.push(listener);
  const latest = logs[logs.length - 1] || {
    request: null,
    response: null,
    timestamp: Date.now(),
  };
  listener([...logs], latest);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function getApiLogHistory() {
  return [...logs];
}

export function getLatestApiLog() {
  return (
    logs[logs.length - 1] || {
      request: null,
      response: null,
      timestamp: Date.now(),
    }
  );
}

export function setApiRequest(req: ApiRequest) {
  addApiLogRequest(req);
}
export function setApiResponse(res: ApiResponse) {
  addApiLogResponse(res);
}
export function getApiLog() {
  return getLatestApiLog();
}
