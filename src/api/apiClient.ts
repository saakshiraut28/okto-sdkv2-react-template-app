import axios, { isAxiosError } from "axios";

interface Headers {
  [key: string]: string;
}

export const post = async (url: string, headers: Headers, data: any) => {
  try {
    console.log("POST request:", url, headers, data);
    const response = await axios.post(url, data, { headers: headers });
    console.log("POST response:", response);
    return response.data;
  } catch (error) {
    console.log(error);
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
