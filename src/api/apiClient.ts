import axios, { isAxiosError } from "axios";

interface Headers {
  [key: string]: string;
}

export const post = async (url: string, headers: Headers, data: any) => {
  try {
    const response = await axios.post(url, data, { headers: headers });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      return error.response?.data;
    }
  }
};

export const get = async (url: string, headers: Headers) => {
  try {
    const response = await axios.get(url, { headers: headers });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      return error.response?.data;
    }
  }
};
