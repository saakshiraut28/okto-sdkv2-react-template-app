import type { Hex } from "viem";
import { signMessage } from "viem/accounts";
import { post } from "./apiClient";

const AUTHENTICATE_URI: string = "api/auth/authenticate";
const REQUEST_EMAIL_OTP_URI: string = "api/auth/email/otp";
const EMAIL_VERIFY_OTP_URI: string = "api/auth/email/verify-otp";
const REQUEST_WHATSAPP_OTP_URI: string = "api/auth/whatsapp/otp";
const WHATSAPP_VERIFY_OTP_URI: string = "api/auth/whatsapp/verify-otp";

export const requestOTPForEmail = async (
  baseURL: string,
  email: string,
  clientPK: Hex,
  clientSWA: Hex
) => {
  const url: string = `${baseURL}/${REQUEST_EMAIL_OTP_URI}`;
  const data: any = {
    client_swa: clientSWA,
    client_pk: clientPK,
    email: email,
  };
  const headers = {
    "Content-Type": "application/json",
  };
  const response: any = await post(url, headers, data);
  return response.data;
};

export const verifyOTPForEmail = async (
  baseURL: string,
  email: string,
  otp: string,
  token: string,
  clientPK: Hex,
  clientSWA: Hex
) => {
  const url: string = `${baseURL}/${EMAIL_VERIFY_OTP_URI}`;
  const data: any = {
    email: email,
    otp: otp,
    token: token,
    client_pk: clientPK,
    client_swa: clientSWA,
  };
  const headers = {
    "Content-Type": "application/json",
  };
  const response: any = await post(url, headers, data);
  return response.data;
};

export const requestOTPForWhatsapp = async (
  baseURL: string,
  whatsapp_number: string,
  country_short_name: string,
  clientPK: Hex,
  clientSWA: Hex
) => {
  const url: string = `${baseURL}/${REQUEST_WHATSAPP_OTP_URI}`;
  const data: any = {
    whatsapp_number: whatsapp_number,
    country_short_name: country_short_name,
    client_pk: clientPK,
    client_swa: clientSWA,
  };
  const headers = {
    "Content-Type": "application/json",
  };
  const response: any = await post(url, headers, data);
  return response.data;
};

export const verifyOTPForWhatsapp = async (
  baseURL: string,
  whatsapp_number: string,
  country_short_name: string,
  otp: string,
  token: string,
  clientPK: Hex,
  clientSWA: Hex
) => {
  const url: string = `${baseURL}/${WHATSAPP_VERIFY_OTP_URI}`;
  const data: any = {
    whatsapp_number: whatsapp_number,
    country_short_name: country_short_name,
    otp: otp,
    token: token,
    client_pk: clientPK,
    client_swa: clientSWA,
  };
  const headers = {
    "Content-Type": "application/json",
  };
  const response: any = await post(url, headers, data);
  return response.data;
};

export const authenticate = async (
  baseURL: string,
  idToken: string,
  provider: string,
  clientPK: Hex,
  clientSWA: Hex
) => {
  const url: string = `${baseURL}/${AUTHENTICATE_URI}`;
  const data: any = {
    idToken: idToken,
    provider: provider,
    client_pk: clientPK,
    client_swa: clientSWA,
  };
  const headers = {
    "Content-Type": "application/json",
  };
  const response: any = await post(url, headers, data);
  return response;
};

export const getAuthorizationToken = async (sessionConfig: any) => {
  const sessionPriv = sessionConfig?.sessionPrivKey;
  const sessionPub = sessionConfig?.sessionPubKey;
  if (sessionPriv === void 0 || sessionPub === void 0) {
    throw new Error("Session keys are not set");
  }
  const data = {
    expire_at: Math.round(Date.now() / 1e3) + 60 * 90,
    session_pub_key: sessionPub,
  };

  // Okto auth token is nothing but the session public key encrypted with the session private key
  const payload = {
    type: "ecdsa_uncompressed",
    data,
    data_signature: await signMessage({
      message: JSON.stringify(data),
      privateKey: sessionPriv,
    }),
  };
  return btoa(JSON.stringify(payload));
};
