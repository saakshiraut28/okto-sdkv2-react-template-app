import { post } from "./apiClient";

const INTENT_TOKEN_TRANSFER_URI = "api/intent/tokenTransfer";
const INTENT_TOKEN_TRANSFER_ESTIMATE_URI = "api/intent/tokenTransfer/estimate";
const INTENT_TOKEN_TRANSFER_EXECUTE_AFTER_ESTIMATE_URI =
  "api/intent/tokenTransfer/executeAfterEstimate";
const INTENT_RAW_TRANSACTION_URI = "api/intent/rawTransaction";
const INTENT_RAW_TRANSACTION_ESTIMATE_URI =
  "api/intent/rawTransaction/estimate";
const INTENT_RAW_TRANSACTION_EXECUTE_AFTER_ESTIMATE_URI =
  "api/intent/rawTransaction/executeAfterEstimate";
const INTENT_NFT_TRANSFER_URI = "api/intent/nftTransfer";
const INTENT_NFT_TRANSFER_ESTIMATE_URI = "api/intent/nftTransfer/estimate";
const INTENT_NFT_TRANSFER_EXECUTE_AFTER_ESTIMATE_URI =
  "api/intent/nftTransfer/executeAfterEstimate";

export const tokenTransfer = async (
  baseURL: string,
  caip2Id: string,
  recipient: string,
  token: string,
  amount: string,
  sessionConfig: any,
  clientSWA: string,
  clientPK: string,
  feePayerAddress?: string
) => {
  const url = `${baseURL}/${INTENT_TOKEN_TRANSFER_URI}`;
  const data: any = {
    caip2Id,
    recipient,
    token,
    amount,
    sessionConfig,
    client_swa: clientSWA,
    client_pk: clientPK,
  };
  if (feePayerAddress) data.feePayerAddress = feePayerAddress;
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const tokenTransferEstimate = async (
  baseURL: string,
  caip2Id: string,
  recipient: string,
  token: string,
  amount: string,
  sessionConfig: any,
  clientSWA: string,
  clientPK: string,
  feePayerAddress?: string
) => {
  const url = `${baseURL}/${INTENT_TOKEN_TRANSFER_ESTIMATE_URI}`;
  const data: any = {
    caip2Id,
    recipient,
    token,
    amount,
    sessionConfig,
    client_swa: clientSWA,
    client_pk: clientPK,
  };
  if (feePayerAddress) data.feePayerAddress = feePayerAddress;
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const tokenTransferExecuteAfterEstimate = async (
  baseURL: string,
  userOp: any,
  sessionConfig: any
) => {
  const url = `${baseURL}/${INTENT_TOKEN_TRANSFER_EXECUTE_AFTER_ESTIMATE_URI}`;
  const data: any = {
    userOp,
    sessionConfig,
  };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const rawTransaction = async (
  baseURL: string,
  caip2Id: string,
  transaction: any,
  sessionConfig: any,
  clientSWA: string,
  clientPK: string,
  feePayerAddress?: string
) => {
  const url = `${baseURL}/${INTENT_RAW_TRANSACTION_URI}`;
  const data: any = {
    caip2Id,
    transaction,
    sessionConfig,
    client_swa: clientSWA,
    client_pk: clientPK,
  };
  if (feePayerAddress) data.feePayerAddress = feePayerAddress;
  const headers = {
    "Content-Type": "application/json",
  };
  console.log("inside rawTransaction intent.ts");
  return await post(url, headers, data);
};

export const rawTransactionEstimate = async (
  baseURL: string,
  caip2Id: string,
  transaction: any,
  sessionConfig: any,
  clientSWA: string,
  clientPK: string,
  feePayerAddress?: string
) => {
  const url = `${baseURL}/${INTENT_RAW_TRANSACTION_ESTIMATE_URI}`;
  const data: any = {
    caip2Id,
    transaction,
    sessionConfig,
    client_swa: clientSWA,
    client_pk: clientPK,
  };
  if (feePayerAddress) data.feePayerAddress = feePayerAddress;
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const rawTransactionExecuteAfterEstimate = async (
  baseURL: string,
  userOp: any,
  sessionConfig: any
) => {
  const url = `${baseURL}/${INTENT_RAW_TRANSACTION_EXECUTE_AFTER_ESTIMATE_URI}`;
  const data: any = {
    userOp,
    sessionConfig,
  };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const nftTransfer = async (
  baseURL: string,
  caip2Id: string,
  collectionAddress: string,
  nftId: string,
  recipientWalletAddress: string,
  amount: number,
  nftType: string,
  sessionConfig: any,
  clientSWA: string,
  clientPK: string,
  feePayerAddress?: string
) => {
  const url = `${baseURL}/${INTENT_NFT_TRANSFER_URI}`;
  const data: any = {
    caip2Id,
    collectionAddress,
    nftId,
    recipientWalletAddress,
    amount,
    nftType,
    sessionConfig,
    client_swa: clientSWA,
    client_pk: clientPK,
  };
  if (feePayerAddress) data.feePayerAddress = feePayerAddress;
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const nftTransferEstimate = async (
  baseURL: string,
  caip2Id: string,
  collectionAddress: string,
  nftId: string,
  recipientWalletAddress: string,
  amount: number,
  nftType: string,
  sessionConfig: any,
  clientSWA: string,
  clientPK: string,
  feePayerAddress?: string
) => {
  const url = `${baseURL}/${INTENT_NFT_TRANSFER_ESTIMATE_URI}`;
  const data: any = {
    caip2Id,
    collectionAddress,
    nftId,
    recipientWalletAddress,
    amount,
    nftType,
    sessionConfig,
    client_swa: clientSWA,
    client_pk: clientPK,
  };
  if (feePayerAddress) data.feePayerAddress = feePayerAddress;
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};

export const nftTransferExecuteAfterEstimate = async (
  baseURL: string,
  userOp: any,
  sessionConfig: any
) => {
  const url = `${baseURL}/${INTENT_NFT_TRANSFER_EXECUTE_AFTER_ESTIMATE_URI}`;
  const data: any = {
    userOp,
    sessionConfig,
  };
  const headers = {
    "Content-Type": "application/json",
  };
  return await post(url, headers, data);
};
