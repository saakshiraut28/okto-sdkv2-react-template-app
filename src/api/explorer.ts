import { post } from "./apiClient";

const EXPLORER_ACCOUNT_URI = "api/explorer/account";
const EXPLORER_CHAINS_URI = "api/explorer/chains";
const EXPLORER_TOKENS_URI = "api/explorer/tokens";
const EXPLORER_PORTFOLIO_URI = "api/explorer/portfolio";
const EXPLORER_PORTFOLIO_ACTIVITY_URI = "api/explorer/portfolio-activity";
const EXPLORER_PORTFOLIO_NFT_URI = "api/explorer/portfolio-nft";
const EXPLORER_ORDER_HISTORY_URI = "api/explorer/order-history";

export const getAccount = async (baseURL: string, sessionConfig: any) => {
  const url = `${baseURL}/${EXPLORER_ACCOUNT_URI}`;
  const data = { sessionConfig };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const getChains = async (baseURL: string, sessionConfig: any) => {
  const url = `${baseURL}/${EXPLORER_CHAINS_URI}`;
  const data = { sessionConfig };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const getTokens = async (baseURL: string, sessionConfig: any) => {
  const url = `${baseURL}/${EXPLORER_TOKENS_URI}`;
  const data = { sessionConfig };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const getPortfolio = async (baseURL: string, sessionConfig: any) => {
  const url = `${baseURL}/${EXPLORER_PORTFOLIO_URI}`;
  const data = { sessionConfig };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const getPortfolioActivity = async (
  baseURL: string,
  sessionConfig: any
) => {
  const url = `${baseURL}/${EXPLORER_PORTFOLIO_ACTIVITY_URI}`;
  const data = { sessionConfig };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const getPortfolioNFT = async (baseURL: string, sessionConfig: any) => {
  const url = `${baseURL}/${EXPLORER_PORTFOLIO_NFT_URI}`;
  const data = { sessionConfig };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const getOrderHistory = async (baseURL: string, sessionConfig: any) => {
  const url = `${baseURL}/${EXPLORER_ORDER_HISTORY_URI}`;
  const data = { sessionConfig };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};
