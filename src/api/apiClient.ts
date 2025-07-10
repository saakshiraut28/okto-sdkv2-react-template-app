import axios, { isAxiosError } from "axios";
import { setApiRequest, setApiResponse } from "../context/apiLogEmitter";

interface Headers {
  [key: string]: string;
}

export const post = async (url: string, headers: Headers, data: any) => {
  try {
    setApiRequest({ method: "POST", url, headers, body: data });
    console.log("POST request:", url, headers, data);
    const response = await axios.post(url, data, { headers: headers });
    console.log("POST response:", response);
    setApiResponse({ status: response.status, body: response.data });
    return response.data;
  } catch (error) {
    console.log(error);
    if (isAxiosError(error)) {
      setApiResponse({
        status: error.response?.status,
        body: error.response?.data,
      });
      return error.response?.data;
    }
  }
};

export const get = async (url: string, headers: Headers) => {
  try {
    setApiRequest({ method: "GET", url, headers });
    const response = await axios.get(url, { headers: headers });
    setApiResponse({ status: response.status, body: response.data });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      setApiResponse({
        status: error.response?.status,
        body: error.response?.data,
      });
      return error.response?.data;
    }
  }
};
