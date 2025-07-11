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

type Listener = (req: ApiRequest | null, res: ApiResponse | null) => void;

let request: ApiRequest | null = null;
let response: ApiResponse | null = null;
const listeners: Listener[] = [];

export function setApiRequest(req: ApiRequest) {
  request = req;
  listeners.forEach((l) => l(request, response));
}
export function setApiResponse(res: ApiResponse) {
  response = res;
  listeners.forEach((l) => l(request, response));
}
export function subscribeApiLog(listener: Listener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}
export function getApiLog() {
  return { request, response };
}
