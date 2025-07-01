import type { Hex } from "viem";
import { get, post } from "./apiClient";

const AUTHENTICATE_URI: string = "api/auth/authenticate";
const REQUEST_EMAIL_OTP_URI: string = "api/auth/email/otp";
const EMAIL_VERIFY_OTP_URI: string = "api/auth/email/verify-otp";

export const requestOTPForEmail = async (baseURL: string, email: string, clientPK: Hex, clientSWA: Hex) => {
    const url: string = `${baseURL}/${REQUEST_EMAIL_OTP_URI}`;
    const data: any = {
        client_swa: clientSWA,
        client_pk: clientPK,
        email: email
    }
    const headers = {
        "Content-Type": "application/json"
    }
    const response: any = await post(url, headers, data);
    return response.data;
}

export const verifyOTPForEmail = async (baseURL: string, email: string, otp: string, token: string, clientPK: Hex, clientSWA: Hex) => {
    const url: string = `${baseURL}/${EMAIL_VERIFY_OTP_URI}`;
    const data: any = {
        email: email,
        otp: otp,
        token: token,
        client_pk: clientPK,
        client_swa: clientSWA
    }
    const headers = {
        "Content-Type": "application/json"
    }
    const response: any = await post(url, headers, data);
    return response.data;
}

export const authenticate = async (baseURL: string, idToken: string, provider: string, clientPK: Hex, clientSWA: Hex) => {
    const url: string = `${baseURL}/${AUTHENTICATE_URI}`;
    const data: any = {
        idToken: idToken,
        provider: provider,
        client_pk: clientPK,
        client_swa: clientSWA
    }
    const headers = {
        "Content-Type": "application/json"
    }
    const response: any = await post(url, headers, data);
    return response.data;
}
