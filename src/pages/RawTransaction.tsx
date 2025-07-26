"use client";
import { useEffect, useState, useContext } from "react";
import {
  useOkto,
  evmRawTransaction,
  Address,
  getChains,
  getAccount,
  getOrdersHistory,
  aptosRawTransaction,
  svmRawTransaction,
} from "@okto_web3/react-sdk";
import { aptosRawTransaction as aptosRawTransactionUserop } from "@okto_web3/react-sdk/userop";
import { svmRawTransaction as svmRawTransactionUserop } from "@okto_web3/react-sdk/userop";
import { evmRawTransaction as evmRawTransactionUserop } from "@okto_web3/react-sdk/userop";
import { useNavigate } from "react-router-dom";
import CopyButton from "../components/CopyButton";
import ViewExplorerURL from "../components/ViewExplorerURL";
import { ConfigContext } from "../context/ConfigContext";
import * as explorer from "../api/explorer";
import * as intent from "../api/intent";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

interface SolanaKey {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
}

interface SolanaInstruction {
  programId: string;
  data: string; // comma-separated numbers as string
  keys: SolanaKey[];
}

// Components
const Modal = ({ isOpen, onClose, title, children }: ModalProps) =>
  !isOpen ? null : (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
  </svg>
);

function EVMRawTransaction() {
  const oktoClient = useOkto();
  const navigate = useNavigate();
  const { config } = useContext(ConfigContext);

  const [mode, setMode] = useState<"EVM" | "APTOS" | "SOLANA">("EVM");
  const [chains, setChains] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState<any>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [feePayer, setFeePayer] = useState<string>("");
  const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);
  const [moveFunction, setMoveFunction] = useState("");
  const [typeArguments, setTypeArguments] = useState<string>(""); // comma-separated string
  const [functionArguments, setFunctionArguments] = useState<string>(""); // comma-separated string
  const [signer, setSigner] = useState("");
  const [instructions, setInstructions] = useState<SolanaInstruction[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Transaction state
  const [jobId, setJobId] = useState<string | null>(null);
  const [userOp, setUserOp] = useState<any | null>(null);
  const [signedUserOp, setSignedUserOp] = useState<any | null>(null);
  const [orderHistory, setOrderHistory] = useState<any | null>(null);
  // Estimate state for API mode
  const [estimateResponse, setEstimateResponse] = useState<any | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Helper functions
  const showModal = (modal: string) => setActiveModal(modal);
  const closeAllModals = () => setActiveModal(null);

  const resetForm = () => {
    setSelectedChain("");
    setValue("");
    setFrom("");
    setTo("");
    setData("");
    setFeePayer("");
    setUserOp(null);
    setSignedUserOp(null);
    setJobId(null);
    setOrderHistory(null);
    setError(null);
    closeAllModals();
  };

  const handleContractRead = () => {
    if (mode === "EVM") return handleEVMRawTransaction();
    if (mode === "APTOS") return handleAptosRawTransaction();
    if (mode === "SOLANA") return handleSolanaRawTransaction();
  };

  // Helper to get sessionConfig for API mode
  const getSessionConfig = () => {
    const session = localStorage.getItem("okto_session");
    return JSON.parse(session || "{}");
  };

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        let fetchedChains, fetchedAccounts;
        if (config.mode === "api") {
          const sessionConfig = getSessionConfig();
          const resChains = await explorer.getChains(
            config.apiUrl,
            sessionConfig
          );
          fetchedChains = resChains.data.network;
          const resAccounts = await explorer.getAccount(
            config.apiUrl,
            sessionConfig
          );
          fetchedAccounts = resAccounts.data;
        } else {
          fetchedChains = await getChains(oktoClient);
          fetchedAccounts = await getAccount(oktoClient);
        }
        setChains(fetchedChains);
        setAccounts(fetchedAccounts);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(`Failed to fetch data: ${error.message}`);
      }
    };
    fetchData();
  }, [oktoClient, config]);

  useEffect(() => {
    if (!selectedChain) {
      setFrom(""); // Reset if no chain is selected
      return;
    }

    const matchedAccount = accounts.find(
      (account) => account.caipId === selectedChain
    );
    setFrom(matchedAccount ? matchedAccount.address : "");
  }, [selectedChain, accounts]);

  // handle network change
  const handleNetworkChange = (e: any) => {
    const selectedCaipId = e.target.value;
    setSelectedChain(selectedCaipId);
    const selectedChainObj = chains.find(
      (chain) => (chain.caipId || chain.caip_id) === selectedCaipId
    );
    setSponsorshipEnabled(
      selectedChainObj?.sponsorshipEnabled ??
        selectedChainObj?.sponsorship_enabled ??
        false
    );
  };

  // Transaction handlers
  const handleGetOrderHistory = async (id?: string) => {
    const intentId = id || jobId;
    if (!intentId) {
      setError("No job ID available");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let orders;
      if (config.mode === "api") {
        const sessionConfig = getSessionConfig();
        const res = await explorer.getOrderHistory(
          config.apiUrl,
          sessionConfig
        );
        orders = (res.data?.items || []).filter(
          (o: any) => (o.intent_id || o.intentId) === intentId
        );
      } else {
        orders = await getOrdersHistory(oktoClient, {
          intentId,
          intentType: "RAW_TRANSACTION",
        });
      }
      setOrderHistory(orders?.[0]);
      console.log("Refreshed Order History:", orders);
      setActiveModal("orderHistory");
    } catch (error: any) {
      console.error("Error in fetching order history", error);
      setError(`Error fetching transaction details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrderHistory = async () => {
    if (!jobId) {
      setError("No job ID available to refresh");
      return;
    }
    setIsRefreshing(true);
    try {
      let orders;
      if (config.mode === "api") {
        const sessionConfig = getSessionConfig();
        const res = await explorer.getOrderHistory(
          config.apiUrl,
          sessionConfig
        );
        orders = (res.data?.items || []).filter(
          (o: any) => (o.intent_id || o.intentId) === jobId
        );
      } else {
        orders = await getOrdersHistory(oktoClient, {
          intentId: jobId,
          intentType: "RAW_TRANSACTION",
        });
      }
      setOrderHistory(orders?.[0]);
    } catch (error: any) {
      console.error("Error refreshing order history", error);
      setError(`Error refreshing transaction details: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateUserOp = async () => {
    if (
      selectedChain === "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" ||
      selectedChain === "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
    ) {
      if (!sponsorshipEnabled) {
        console.error(
          "Sponsorship is mandatory for Solana Mainnet and Devnet."
        );
        setError("Sponsorship is mandatory for Solana Mainnet and Devnet.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "EVM") {
        const rawTransactionIntentParams = {
          caip2Id: selectedChain,
          transaction: {
            from: from as Address,
            to: to as Address,
            value: BigInt(value),
            data: (data ? data : undefined) as any,
          },
        };
        let createdUserOp;
        if (config.mode === "sdk") {
          if (selectedChain && sponsorshipEnabled) {
            createdUserOp = await evmRawTransactionUserop(
              oktoClient,
              rawTransactionIntentParams,
              feePayer as Address
            );
          } else {
            createdUserOp = await evmRawTransactionUserop(
              oktoClient,
              rawTransactionIntentParams
            );
          }
        } else if (config.mode === "api") {
          const session = localStorage.getItem("okto_session");
          const sessionConfig = JSON.parse(session || "{}");
          const res = await intent.rawTransactionUserOp(
            config.apiUrl,
            selectedChain,
            {
              from: from as Address,
              to: to as Address,
              value: value.toString(),
              data: (data ? data : undefined) as any,
            },
            sessionConfig,
            config.clientSWA,
            config.clientPrivateKey,
            sponsorshipEnabled ? feePayer : undefined
          );
          createdUserOp = res;
        }
        setUserOp(createdUserOp);
        showModal("unsignedOp");
      } else if (mode === "APTOS") {
        // Aptos userop
        const parsedArgs = (() => {
          try {
            const input = `[${functionArguments}]`;
            return JSON.parse(input, (_, value) => {
              if (typeof value === "string") {
                const trimmed = value.trim();
                if (/^0x[a-fA-F0-9]+$/.test(trimmed)) return trimmed;
                if (/^\d+$/.test(trimmed)) return Number(trimmed);
                return trimmed;
              }
              return value;
            });
          } catch (e) {
            console.error("Invalid function arguments:", e);
            return [];
          }
        })();

        const transaction = {
          function: moveFunction,
          typeArguments: typeArguments
            .split(",")
            .map((arg) => arg.trim())
            .filter(Boolean),
          functionArguments: parsedArgs,
        };

        const payload = {
          caip2Id: selectedChain,
          transactions: [transaction],
        };

        let createdUserOp;
        if (config.mode === "sdk") {
          if (selectedChain && sponsorshipEnabled) {
            createdUserOp = await aptosRawTransactionUserop(
              oktoClient,
              payload,
              feePayer as Address
            );
          } else {
            createdUserOp = await aptosRawTransactionUserop(
              oktoClient,
              payload
            );
          }
          setIsLoading(false);
          setUserOp(createdUserOp);
          showModal("unsignedOp");
          setIsLoading(false);
          return;
        } else if (config.mode === "api") {
          const session = localStorage.getItem("okto_session");
          const sessionConfig = JSON.parse(session || "{}");
          const res = await intent.rawTransactionUserOp(
            config.apiUrl,
            selectedChain,
            payload.transactions,
            sessionConfig,
            config.clientSWA,
            config.clientPrivateKey
          );
          createdUserOp = res;
        }
        setUserOp(createdUserOp);
        showModal("unsignedOp");
        console.log("It's working");
      } else if (mode === "SOLANA") {
        // Solana userOp logic
        const processedInstructions = instructions.map((instruction) => ({
          programId: instruction.programId,
          data: instruction.data
            .split(",")
            .map((num) => parseInt(num.trim()))
            .filter((num) => !isNaN(num)),
          keys: instruction.keys.map((key) => ({
            pubkey: key.pubkey,
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
        }));

        const rawTransactionIntentParams = {
          caip2Id: selectedChain,
          transactions: [
            {
              instructions: processedInstructions,
              signers: [signer],
              feePayerAddress: sponsorshipEnabled
                ? (feePayer as Address)
                : signer,
            },
          ],
        };

        let createdUserOp;
        if (config.mode === "sdk") {
          if (selectedChain && sponsorshipEnabled) {
            createdUserOp = await svmRawTransactionUserop(
              oktoClient,
              rawTransactionIntentParams,
              feePayer as Address
            );
          } else {
            console.error("Sponsorship is mandatory for solana");
          }
          setIsLoading(false);
          setUserOp(createdUserOp);
          showModal("unsignedOp");
          return;
        } else if (config.mode === "api") {
          const session = localStorage.getItem("okto_session");
          const sessionConfig = JSON.parse(session || "{}");
          const res = await intent.rawTransactionUserOp(
            config.apiUrl,
            rawTransactionIntentParams.caip2Id,
            rawTransactionIntentParams.transactions,
            sessionConfig,
            config.clientSWA,
            config.clientPrivateKey
          );
          createdUserOp = res;
          setUserOp(createdUserOp);
          showModal("unsignedOp");
        }
      }
    } catch (error: any) {
      console.error("Error creating UserOp:", error);
      setError(error.message || "Error creating UserOp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUserOp = async () => {
    if (!userOp) {
      setError("No transaction to sign");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let signedOp;
      if (config.mode === "sdk") {
        signedOp = await oktoClient.signUserOp(userOp);
      } else if (config.mode === "api") {
        const session = localStorage.getItem("okto_session");
        const sessionConfig = JSON.parse(session || "{}");
        const res = await intent.signUserOp(
          config.apiUrl,
          userOp,
          sessionConfig
        );
        signedOp = res;
      }
      setSignedUserOp(signedOp);
      showModal("signedOp");
      console.log("Signed UserOp", signedOp);
    } catch (error: any) {
      console.error("Error signing UserOp:", error);
      setError(error.message || "Error signing UserOp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteUserOp = async () => {
    if (!signedUserOp) {
      setError("No signed transaction to execute");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let jobId;
      if (config.mode === "sdk") {
        jobId = await oktoClient.executeUserOp(signedUserOp);
      } else if (config.mode === "api") {
        const session = localStorage.getItem("okto_session");
        const sessionConfig = JSON.parse(session || "{}");
        const res = await intent.executeUserOp(
          config.apiUrl,
          signedUserOp,
          sessionConfig
        );
        jobId = res.data?.jobId;
      }
      setJobId(jobId);
      await handleGetOrderHistory(jobId);
      showModal("jobId");
      console.log("Job Id", jobId);
    } catch (error: any) {
      console.error("Error executing UserOp:", error);
      setError(error.message || "Error executing UserOp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEVMRawTransaction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let jobId;
      if (config.mode === "api") {
        const rawTransactionIntentParams = {
          caip2Id: selectedChain,
          transaction: {
            from: from as Address,
            to: to as Address,
            value: value.toString(), // string for API
            data: (data ? data : undefined) as any,
          },
        };
        const sessionConfig = getSessionConfig();
        const res = await intent.rawTransaction(
          config.apiUrl,
          rawTransactionIntentParams.caip2Id,
          rawTransactionIntentParams.transaction,
          sessionConfig,
          config.clientSWA,
          config.clientPrivateKey,
          sponsorshipEnabled ? feePayer : undefined
        );
        if (res && res.data && res.data.jobId) {
          jobId = res.data.jobId;
        } else {
          setError("No jobId returned from API");
          setIsLoading(false);
          return;
        }
      } else {
        // SDK mode: use BigInt for value
        const sdkParams = {
          caip2Id: selectedChain,
          transaction: {
            from: from as Address,
            to: to as Address,
            value: BigInt(value),
            data: (data ? data : undefined) as any,
          },
        };
        if (selectedChain && sponsorshipEnabled) {
          jobId = await evmRawTransaction(
            oktoClient,
            sdkParams,
            feePayer as Address
          );
        } else {
          jobId = await evmRawTransaction(oktoClient, sdkParams);
        }
      }
      setJobId(jobId);
      await handleGetOrderHistory(jobId ? jobId : undefined);
      showModal("jobId");
      console.log(jobId);
    } catch (error: any) {
      console.error("Error executing EVM Raw Transaction:", error);
      setError(error.message || "Error executing EVM Raw Transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAptosRawTransaction = async () => {
    setIsLoading(true);
    setError(null);
    setJobId(null);

    try {
      if (config.mode === "api") {
        const payload = {
          caip2Id: selectedChain,
          transactions: {
            function: moveFunction,
            typeArguments: typeArguments
              .split(",")
              .map((arg) => arg.trim())
              .filter(Boolean),
            functionArguments: (() => {
              try {
                const input = `[${functionArguments}]`;
                return JSON.parse(input, (_, value) => {
                  if (typeof value === "string") {
                    const trimmed = value.trim();
                    if (/^0x[a-fA-F0-9]+$/.test(trimmed)) return trimmed;
                    if (/^\d+$/.test(trimmed)) return Number(trimmed);
                    return trimmed;
                  }
                  return value;
                });
              } catch (e) {
                console.error("Invalid function arguments:", e);
                return [];
              }
            })(),
          },
        };
        const sessionConfig = getSessionConfig();
        const res = await intent.rawTransaction(
          config.apiUrl,
          payload.caip2Id,
          payload.transactions,
          sessionConfig,
          config.clientSWA,
          config.clientPrivateKey
        );
        if (res && res.data && res.data.jobId) {
          setJobId(res.data.jobId);
          await handleGetOrderHistory(res.data.jobId);
          showModal("jobId");
          console.log("Job ID:", res.data.jobId);
        } else {
          setError("No jobId returned from API");
        }
      } else {
        const payload = {
          caip2Id: selectedChain,
          transactions: [
            {
              function: moveFunction,
              typeArguments: typeArguments
                .split(",")
                .map((arg) => arg.trim())
                .filter(Boolean),
              functionArguments: (() => {
                try {
                  const input = `[${functionArguments}]`;
                  return JSON.parse(input, (_, value) => {
                    if (typeof value === "string") {
                      const trimmed = value.trim();
                      if (/^0x[a-fA-F0-9]+$/.test(trimmed)) return trimmed;
                      if (/^\d+$/.test(trimmed)) return Number(trimmed);
                      return trimmed;
                    }
                    return value;
                  });
                } catch (e) {
                  console.error("Invalid function arguments:", e);
                  return [];
                }
              })(),
            },
          ],
        };
        const jobId = await aptosRawTransaction(oktoClient, payload);
        setJobId(jobId);
        await handleGetOrderHistory(jobId);
        showModal("jobId");
        console.log("Job ID:", jobId);
      }
    } catch (error: any) {
      console.error("Error executing Aptos Raw Transaction:", error);
      setError(error.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Estimate + Execute (API mode only)
  const handleRawTransactionEstimate = async () => {
    if (config.mode == "sdk") return;

    if (mode === "EVM") {
      setIsLoading(true);
      setError(null);
      try {
        const rawTransactionIntentParams = {
          caip2Id: selectedChain,
          transaction: {
            from: from as Address,
            to: to as Address,
            value: value.toString(), // string for API
            data: (data ? data : undefined) as any,
          },
        };
        const sessionConfig = getSessionConfig();
        const res = await intent.rawTransactionEstimate(
          config.apiUrl,
          rawTransactionIntentParams.caip2Id,
          rawTransactionIntentParams.transaction,
          sessionConfig,
          config.clientSWA,
          config.clientPrivateKey,
          sponsorshipEnabled ? feePayer : undefined
        );
        setEstimateResponse(res.data);
        showModal("estimate");
        console.log("Estimate Response:", res.data);
      } catch (error: any) {
        console.error("Error in raw transaction estimate:", error);
        setError(`Error in raw transaction estimate: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    } else if (mode === "APTOS") {
      setIsLoading(true);
      setError(null);
      try {
        const payload = {
          caip2Id: selectedChain,
          transactions: {
            function: moveFunction,
            typeArguments: typeArguments
              .split(",")
              .map((arg) => arg.trim())
              .filter(Boolean),
            functionArguments: (() => {
              try {
                const input = `[${functionArguments}]`;
                return JSON.parse(input, (_, value) => {
                  if (typeof value === "string") {
                    const trimmed = value.trim();
                    if (/^0x[a-fA-F0-9]+$/.test(trimmed)) return trimmed;
                    if (/^\d+$/.test(trimmed)) return Number(trimmed);
                    return trimmed;
                  }
                  return value;
                });
              } catch (e) {
                console.error("Invalid function arguments:", e);
                return [];
              }
            })(),
          },
        };
        const sessionConfig = getSessionConfig();
        const res = await intent.rawTransactionEstimate(
          config.apiUrl,
          payload.caip2Id,
          payload.transactions,
          sessionConfig,
          config.clientSWA,
          config.clientPrivateKey
        );
        setEstimateResponse(res.data);
        showModal("estimate");
        console.log("Estimate Response (Aptos):", res.data);
      } catch (error: any) {
        console.error("Error in aptos raw transaction estimate:", error);
        setError(`Error in aptos raw transaction estimate: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRawTransactionExecuteAfterEstimate = async () => {
    if (config.mode !== "api") return;
    if (!estimateResponse) {
      setError("No estimate transaction to execute");
      return;
    }
    setIsLoading(true);
    setError(null);
    let jobId;
    try {
      const session = localStorage.getItem("okto_session");
      const sessionConfig = JSON.parse(session || "{}");
      const res = await intent.rawTransactionExecuteAfterEstimate(
        config.apiUrl,
        estimateResponse.userOps,
        sessionConfig
      );
      jobId = res.data?.jobId;
      setJobId(jobId);
      await handleGetOrderHistory(jobId);
      showModal("jobId");
      console.log("Job Id", jobId);
    } catch (error: any) {
      console.error("Error in executing the userop:", error);
      setError(`Error in executing transaction: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle solana raw txn
  const handleSolanaRawTransaction = async () => {
    if (
      selectedChain === "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" ||
      selectedChain === "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
    ) {
      if (!sponsorshipEnabled) {
        console.error(
          "Sponsorship is mandatory for Solana Mainnet and Devnet."
        );
        setError("Sponsorship is mandatory for Solana Mainnet and Devnet.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setJobId(null);

    try {
      if (config.mode === "api") {
        // API mode: prepare transaction data for API call
        const processedInstructions = instructions.map((instruction) => ({
          programId: instruction.programId,
          data: instruction.data
            .split(",")
            .map((num) => parseInt(num.trim()))
            .filter((num) => !isNaN(num)),
          keys: instruction.keys.map((key) => ({
            pubkey: key.pubkey,
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
        }));

        const rawTransactionIntentParams = {
          caip2Id: selectedChain,
          transactions: [
            {
              instructions: processedInstructions,
              signers: [signer],
              feePayerAddress: sponsorshipEnabled
                ? (feePayer as string)
                : signer,
            },
          ],
        };

        const sessionConfig = getSessionConfig();
        const res = await intent.rawTransaction(
          config.apiUrl,
          rawTransactionIntentParams.caip2Id,
          rawTransactionIntentParams.transactions,
          sessionConfig,
          config.clientSWA,
          config.clientPrivateKey,
          sponsorshipEnabled ? feePayer : undefined
        );

        if (res && res.data && res.data.jobId) {
          setJobId(res.data.jobId);
          await handleGetOrderHistory(res.data.jobId);
          showModal("jobId");
          console.log("Job ID:", res.data.jobId);
        } else {
          setError("No jobId returned from API");
        }
      } else {
        // Solana SDK Mode
        const processedInstructions = instructions.map((instruction) => ({
          programId: instruction.programId,
          data: instruction.data
            .split(",")
            .map((num) => parseInt(num.trim()))
            .filter((num) => !isNaN(num)),
          keys: instruction.keys.map((key) => ({
            pubkey: key.pubkey,
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
        }));

        const rawTransactionIntentParams = {
          caip2Id: selectedChain,
          transactions: [
            {
              instructions: processedInstructions,
              signers: [signer],
              feePayerAddress: sponsorshipEnabled
                ? (feePayer as Address)
                : signer,
            },
          ],
        };

        let jobId = await svmRawTransaction(
          oktoClient,
          rawTransactionIntentParams,
          feePayer as Address
        );
        setJobId(jobId);
        await handleGetOrderHistory(jobId ? jobId : undefined);
        showModal("jobId");
        console.log(jobId);
      }
    } catch (error: any) {
      console.error("Error executing Solana Raw Transaction:", error);
      setError(error.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new instruction
  const addInstruction = () => {
    setInstructions((prev) => [
      ...prev,
      {
        programId: "",
        data: "",
        keys: [],
      },
    ]);
  };

  // Remove an instruction
  const removeInstruction = (index: number) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  };

  // Update an instruction field
  const updateInstruction = (
    index: number,
    field: keyof SolanaInstruction,
    value: SolanaInstruction[typeof field]
  ) => {
    setInstructions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add a key to an instruction
  const addKey = (instructionIndex: number) => {
    setInstructions((prev) => {
      const updated = [...prev];
      updated[instructionIndex] = {
        ...updated[instructionIndex],
        keys: [
          ...updated[instructionIndex].keys,
          { pubkey: "", isSigner: false, isWritable: false },
        ],
      };
      return updated;
    });
  };

  // Remove a key from an instruction
  const removeKey = (instructionIndex: number, keyIndex: number) => {
    setInstructions((prev) => {
      const updated = [...prev];
      updated[instructionIndex] = {
        ...updated[instructionIndex],
        keys: updated[instructionIndex].keys.filter((_, i) => i !== keyIndex),
      };
      return updated;
    });
  };

  // Update a field in a specific key of an instruction
  const updateKey = (
    instructionIndex: number,
    keyIndex: number,
    field: keyof SolanaKey,
    value: string | boolean
  ) => {
    setInstructions((prev) => {
      const updated = [...prev];
      const keys = [...updated[instructionIndex].keys];
      keys[keyIndex] = { ...keys[keyIndex], [field]: value };
      updated[instructionIndex] = { ...updated[instructionIndex], keys };
      return updated;
    });
  };

  // Render modals
  const renderModals = () => (
    <>
      {/* Job ID Modal */}
      <Modal
        isOpen={activeModal === "jobId"}
        onClose={() => showModal("orderHistory")}
        title="Transaction Submitted"
      >
        <div className="space-y-4 text-white">
          <p>Your transaction has been submitted successfully.</p>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">Job ID:</p>
            <CopyButton text={jobId ?? ""} />
            <p className="font-mono break-all">{jobId}</p>
          </div>
          <div className="flex justify-center pt-2">
            <button
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors w-full"
              onClick={() => handleGetOrderHistory()}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Check Job Status"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Unsigned Transaction Modal */}
      <Modal
        isOpen={activeModal === "unsignedOp"}
        onClose={closeAllModals}
        title="Review Transaction"
      >
        <div className="space-y-4 text-white">
          <p>Please review your transaction details before signing.</p>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">Transaction Details:</p>
            <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-40">
              <CopyButton text={JSON.stringify(userOp, null, 2) ?? ""} />
              <pre>{JSON.stringify(userOp, null, 2)}</pre>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              className="p-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors w-full"
              onClick={handleSignUserOp}
              disabled={isLoading}
            >
              {isLoading ? "Signing..." : "Sign Transaction"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Signed Transaction Modal */}
      <Modal
        isOpen={activeModal === "signedOp"}
        onClose={closeAllModals}
        title="Sign Completed"
      >
        <div className="space-y-4 text-white">
          <p>
            Your transaction has been signed successfully and is ready to be
            executed.
          </p>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">Signed Transaction:</p>
            <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-40">
              <CopyButton text={JSON.stringify(signedUserOp, null, 2) ?? ""} />
              <pre>{JSON.stringify(signedUserOp, null, 2)}</pre>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors w-full"
              onClick={handleExecuteUserOp}
              disabled={isLoading}
            >
              {isLoading ? "Executing..." : "Execute Transaction"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Order History Modal */}
      <Modal
        isOpen={activeModal === "orderHistory"}
        onClose={closeAllModals}
        title="Transaction Details"
      >
        <div className="space-y-4 text-white">
          <div className="flex justify-between items-center">
            <p>Transaction Details:</p>
          </div>

          {/* Order History Details */}
          {orderHistory ? (
            <div className="bg-gray-700 p-4 rounded-md">
              <p>
                <span className="font-semibold">Intent ID:</span>{" "}
                {orderHistory.intentId || orderHistory.intent_id}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {orderHistory.status}
              </p>
              <p>
                <span className="font-semibold">Transaction Hash:</span>
              </p>
              <pre className="break-all whitespace-pre-wrap overflow-auto bg-gray-800 p-2 rounded-md text-sm max-w-full">
                <CopyButton
                  text={
                    (orderHistory.downstreamTransactionHash ||
                      orderHistory.downstream_transaction_hash ||
                      [])[0] ?? ""
                  }
                />
                {
                  (orderHistory.downstreamTransactionHash ||
                    orderHistory.downstream_transaction_hash ||
                    [])[0]
                }
              </pre>
            </div>
          ) : (
            <p className="text-gray-400">No order history available.</p>
          )}

          {/* GET order History */}
          {orderHistory && (
            <>
              {orderHistory.status === "SUCCESSFUL" ? (
                <div className="flex justify-center w-full pt-2">
                  <ViewExplorerURL orderHistory={orderHistory} />
                  <p>
                    If you are unable to see the View Explorer button. You can
                    go to the respective explorer and check the Internal
                    Transaction for your account.
                  </p>
                </div>
              ) : (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={refreshOrderHistory}
                    className="flex gap-x-3 justify-center items-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors w-full text-center"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <span>Refreshing...</span>
                    ) : (
                      <>
                        <RefreshIcon /> Refresh
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Reset Form Button */}
          <div className="flex justify-center pt-2">
            <button
              className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors w-full"
              onClick={resetForm}
            >
              Create New Transaction
            </button>
          </div>
        </div>
      </Modal>

      {/* Estimate Transaction Modal (API mode only) */}
      <Modal
        isOpen={activeModal === "estimate"}
        onClose={closeAllModals}
        title="Review Transaction Estimate"
      >
        <div className="space-y-4 text-white">
          <p>Estimate details for your transaction.</p>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">
              Estimate Transaction Details:
            </p>
            <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-80">
              <CopyButton
                text={JSON.stringify(estimateResponse, null, 2) ?? ""}
              />
              <pre>{JSON.stringify(estimateResponse, null, 2)}</pre>
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">Summary:</p>
            {mode === "EVM" ? (
              <ul className="space-y-1">
                <li>
                  <span className="text-gray-400">From:</span> {from}
                </li>
                <li>
                  <span className="text-gray-400">To:</span> {to}
                </li>
                <li>
                  <span className="text-gray-400">Value:</span> {value}
                </li>
                <li>
                  <span className="text-gray-400">Network:</span>
                  {selectedChain}
                </li>
              </ul>
            ) : null}
            {mode === "APTOS" ? (
              <ul className="space-y-1">
                <li>
                  <span className="text-gray-400">function:</span>{" "}
                  {moveFunction}
                </li>
                <li>
                  <span className="text-gray-400">typeArguments:</span>{" "}
                  {typeArguments}
                </li>
                <li>
                  <span className="text-gray-400">functionArguments:</span>{" "}
                  {functionArguments}
                </li>
                <li>
                  <span className="text-gray-400">Network:</span>
                  {selectedChain}
                </li>
              </ul>
            ) : null}
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">UserOp:</p>
            <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-80">
              <CopyButton
                text={JSON.stringify(estimateResponse?.userOps, null, 2) ?? ""}
              />
              <pre>{JSON.stringify(estimateResponse?.userOps, null, 2)}</pre>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              className="p-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors w-full"
              onClick={handleRawTransactionExecuteAfterEstimate}
              disabled={isLoading}
            >
              {isLoading ? "Executing..." : "Execute (UserOp)"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-gray-900 w-full">
      <button
        onClick={() => navigate("/home")}
        className="w-fit py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black mb-8"
      >
        Home
      </button>
      <h1 className="text-white font-bold text-3xl mb-8">Raw Transaction</h1>
      <p className="text-white font-regular text-lg mb-6">
        For a detailed overview of Raw Transaction intent, refer to our
        documentation on{" "}
        <a
          className="underline text-indigo-300"
          href="https://docs.okto.tech/docs/react-sdk/evmRawTransaction"
          target="_blank"
          rel="noopener noreferrer"
        >
          Okto Raw Transaction
        </a>
        .
      </p>
      <div className="flex flex-col gap-4 w-full max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Select Chain Type
          </label>
          <select
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "EVM" | "APTOS" | "SOLANA")
            }
            disabled={isLoading}
          >
            <option value="EVM">EVM</option>
            <option value="APTOS">Aptos</option>
            <option value="SOLANA">Solana</option>
          </select>
        </div>

        {mode === "SOLANA" && (
          <p className="mt-2 text-sm text-gray-300 border border-yellow-700 p-2 my-2">
            ⚠️ <strong>For Solana Mainnet & Devnet:</strong> Sponsorship is
            mandatory, and nonce wallets must be created manually.
          </p>
        )}

        {mode === "EVM" ? (
          <div className="flex w-full flex-col items-center bg-black p-6 rounded-lg shadow-xl border border-gray-800">
            {/* Network Selection */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Select Network
              </label>
              <select
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
                value={selectedChain}
                onChange={handleNetworkChange}
                disabled={isLoading}
              >
                <option value="" disabled>
                  Select a network
                </option>
                {chains.map((chain) => (
                  <option
                    key={chain.chainId || chain.chain_id}
                    value={chain.caipId || chain.caip_id}
                  >
                    {chain.networkName || chain.network_name} (
                    {chain.caipId || chain.caip_id})
                  </option>
                ))}
              </select>
            </div>
            {selectedChain && (
              <p className="mt-2 text-sm text-gray-300 border border-indigo-700 p-2 my-2">
                {sponsorshipEnabled
                  ? "Gas sponsorship is available ✅"
                  : "⚠️ Sponsorship is not activated for this chain, the user must hold native tokens to proceed with the transfer. You can get the token from the respective faucets"}
              </p>
            )}

            {selectedChain && sponsorshipEnabled && (
              <div className="w-full my-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Feepayer Address
                </label>
                <input
                  type="text"
                  className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  value={feePayer}
                  onChange={(e) => setFeePayer(e.target.value)}
                  placeholder="Enter feepayer Address"
                />
              </div>
            )}

            {/* Sender Address Input */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Enter Address
              </label>
              <input
                className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Enter Sender Address"
              />
              <p className="mt-2 text-sm text-gray-300 border border-indigo-700 p-2 my-2">
                ⬆️ This is the embedded wallet address associated with the
                currently signed-in user.
              </p>
            </div>

            {/* Recipient Address Input */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Recipient Address
              </label>
              <input
                className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Enter Recipient Address"
              />
            </div>

            {/* Amount Input */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount
              </label>
              <input
                className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter Value in Wei"
              />
            </div>

            {/* Symbol Input */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data (Optionally '0x')
              </label>
              <input
                className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Enter Data (optional)"
              />
            </div>

            <div className="flex gap-2 w-full">
              <button
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-blue-800 disabled:opacity-50"
                onClick={handleEVMRawTransaction}
                disabled={isLoading || !selectedChain || !from || !to || !value}
              >
                {isLoading
                  ? "Processing..."
                  : "Raw Transaction (Direct Execute)"}
              </button>
              <button
                className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:bg-purple-800 disabled:opacity-50"
                onClick={handleCreateUserOp}
                disabled={isLoading || !selectedChain || !from || !to || !value}
              >
                {isLoading ? "Processing..." : "Create Raw Transaction UserOp"}
              </button>
            </div>
            {/* API mode: Estimate + Execute */}
            {config.mode === "api" ? (
              <button
                className="w-full mt-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:bg-green-800 disabled:opacity-50"
                onClick={handleRawTransactionEstimate}
                disabled={isLoading || !selectedChain || !from || !to || !value}
              >
                {isLoading
                  ? "Processing..."
                  : "Raw Transaction (Estimate + Execute)"}
              </button>
            ) : null}
          </div>
        ) : mode === "SOLANA" ? (
          <div className="flex w-full flex-col items-center bg-black p-6 rounded-lg shadow-xl border border-gray-800">
            {/* Solana Network Selection */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Select Network
              </label>
              <select
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
                value={selectedChain}
                onChange={handleNetworkChange}
                disabled={isLoading}
              >
                <option value="" disabled>
                  Select a network
                </option>
                {chains.map((chain) => (
                  <option
                    key={chain.chainId || chain.chain_id}
                    value={chain.caipId || chain.caip_id}
                  >
                    {chain.networkName || chain.network_name} (
                    {chain.caipId || chain.caip_id})
                  </option>
                ))}
              </select>
            </div>
            {selectedChain && (
              <p className="mt-2 text-sm text-gray-300 border border-indigo-700 p-2 my-2">
                {sponsorshipEnabled
                  ? "Gas sponsorship is available ✅"
                  : "⚠️ Sponsorship is not activated for this chain, the user must hold native tokens to proceed with the transfer. You can get the token from the respective faucets"}
              </p>
            )}

            {selectedChain && sponsorshipEnabled && (
              <div className="w-full my-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Feepayer Address
                </label>
                <input
                  type="text"
                  className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  value={feePayer}
                  onChange={(e) => setFeePayer(e.target.value)}
                  placeholder="Enter feepayer Address"
                />
              </div>
            )}

            {/* Signer Address Input */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Signer Address
              </label>
              <input
                className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={signer}
                onChange={(e) => setSigner(e.target.value)}
                placeholder="Enter Signer Address"
              />
              <p className="mt-2 text-sm text-gray-300 border border-indigo-700 p-2 my-2">
                ⬆️ This is the embedded wallet address associated with the
                currently signed-in user.
              </p>
            </div>

            {/* Instructions Section */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Instructions
              </label>
              <div className="border border-gray-700 rounded p-4 bg-gray-900">
                {instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className="mb-4 border border-gray-600 rounded p-3 bg-gray-800"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-200">
                        Instruction {index + 1}
                      </h4>
                      <button
                        className="text-red-400 hover:text-red-300 text-sm"
                        onClick={() => removeInstruction(index)}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Program ID */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-400 mb-1">
                        Program ID
                      </label>
                      <input
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        value={instruction.programId}
                        onChange={(e) =>
                          updateInstruction(index, "programId", e.target.value)
                        }
                        placeholder="Enter Program ID"
                      />
                    </div>

                    {/* Instruction Data */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-400 mb-1">
                        Data (comma separated numbers)
                      </label>
                      <input
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        value={instruction.data}
                        onChange={(e) =>
                          updateInstruction(index, "data", e.target.value)
                        }
                        placeholder="e.g. 1,2,3,4"
                      />
                    </div>

                    {/* Keys Section */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Keys (AccountMeta)
                      </label>
                      {instruction.keys.map((key, keyIndex) => (
                        <div
                          key={keyIndex}
                          className="mb-2 p-2 bg-gray-700 rounded border border-gray-600"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-300">
                              Key {keyIndex + 1}
                            </span>
                            <button
                              className="text-red-400 hover:text-red-300 text-xs"
                              onClick={() => removeKey(index, keyIndex)}
                            >
                              Remove
                            </button>
                          </div>

                          <input
                            className="w-full p-1 mb-1 bg-gray-600 border border-gray-500 rounded text-white text-xs placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={key.pubkey}
                            onChange={(e) =>
                              updateKey(
                                index,
                                keyIndex,
                                "pubkey",
                                e.target.value
                              )
                            }
                            placeholder="Public Key"
                          />

                          <div className="flex gap-2">
                            <label className="flex items-center text-xs text-gray-300">
                              <input
                                type="checkbox"
                                className="mr-1"
                                checked={key.isSigner}
                                onChange={(e) =>
                                  updateKey(
                                    index,
                                    keyIndex,
                                    "isSigner",
                                    e.target.checked
                                  )
                                }
                              />
                              Is Signer
                            </label>
                            <label className="flex items-center text-xs text-gray-300">
                              <input
                                type="checkbox"
                                className="mr-1"
                                checked={key.isWritable}
                                onChange={(e) =>
                                  updateKey(
                                    index,
                                    keyIndex,
                                    "isWritable",
                                    e.target.checked
                                  )
                                }
                              />
                              Is Writable
                            </label>
                          </div>
                        </div>
                      ))}

                      <button
                        className="w-full p-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
                        onClick={() => addKey(index)}
                      >
                        Add Key
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  onClick={addInstruction}
                >
                  Add Instruction
                </button>
              </div>
            </div>

            {/* Raw Transaction Button */}
            <div className="flex gap-x-2 w-full">
              <button
                className="w-full p-3 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors disabled:bg-orange-800 disabled:opacity-50"
                onClick={handleSolanaRawTransaction}
                disabled={
                  isLoading ||
                  !selectedChain ||
                  !signer ||
                  instructions.length === 0
                }
              >
                {isLoading ? "Processing..." : "Raw Transaction (Solana)"}
              </button>
              <button
                className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:bg-purple-800 disabled:opacity-50"
                onClick={handleCreateUserOp}
                disabled={
                  isLoading ||
                  !selectedChain ||
                  !signer ||
                  instructions.length === 0
                }
              >
                {isLoading ? "Processing..." : "Create Raw Transaction UserOp"}
              </button>
            </div>

            {/* Status/Error */}
            {error && (
              <p className="mt-2 text-sm text-red-400 border border-red-800 p-2 my-2">
                ❌ Error: {error}
              </p>
            )}
            {jobId && (
              <p className="mt-2 text-sm text-green-400 border border-green-800 p-2 my-2">
                ✅ Job ID: {jobId}
              </p>
            )}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center bg-black p-6 rounded-lg shadow-xl border border-gray-800">
            {/* Aptos Network Selection */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Select Network
              </label>
              <select
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                disabled={isLoading}
              >
                <option value="" disabled>
                  Select a network
                </option>
                {chains.map((chain) => (
                  <option
                    key={chain.chainId || chain.chain_id}
                    value={chain.caipId || chain.caip_id}
                  >
                    {chain.networkName || chain.network_name} (
                    {chain.caipId || chain.caip_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Move Function Input */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Function
              </label>
              <input
                className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={moveFunction}
                onChange={(e) => setMoveFunction(e.target.value)}
                placeholder="e.g. 0x1::coin::transfer"
              />
            </div>

            {/* Type Arguments Input */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Type Arguments (comma separated)
              </label>
              <input
                className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={typeArguments}
                onChange={(e) => setTypeArguments(e.target.value)}
                placeholder="e.g. 0x1::aptos_coin::AptosCoin"
              />
            </div>

            {/* Function Arguments Input */}
            <div className="w-full my-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Function Arguments (comma separated)
              </label>
              <input
                className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={functionArguments}
                onChange={(e) => setFunctionArguments(e.target.value)}
                placeholder="e.g. recipient_address,1000000"
              />
            </div>

            {/* Raw Transaction Button */}
            <div className="flex gap-x-2 w-full">
              <button
                className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:bg-green-800 disabled:opacity-50"
                onClick={handleAptosRawTransaction}
                disabled={isLoading || !selectedChain || !moveFunction}
              >
                {isLoading
                  ? "Processing..."
                  : "Raw Transaction (Direct Execute)"}
              </button>

              <button
                className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:bg-purple-800 disabled:opacity-50"
                onClick={handleCreateUserOp}
                disabled={isLoading || !selectedChain || !moveFunction}
              >
                {isLoading ? "Processing..." : "Create Raw Transaction UserOp"}
              </button>
            </div>
            {/* API mode: Estimate + Execute for Aptos */}
            {config.mode === "api" ? (
              <button
                className="w-full mt-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-blue-800 disabled:opacity-50"
                onClick={handleRawTransactionEstimate}
                disabled={isLoading || !selectedChain || !moveFunction}
              >
                {isLoading
                  ? "Processing..."
                  : "Raw Transaction (Estimate + Execute)"}
              </button>
            ) : null}

            {/* Status/Error */}
            {error && (
              <p className="mt-2 text-sm text-red-400 border border-red-800 p-2 my-2">
                ❌ Error: {error}
              </p>
            )}
            {jobId && (
              <p className="mt-2 text-sm text-green-400 border border-green-800 p-2 my-2">
                ✅ Job ID: {jobId}
              </p>
            )}
          </div>
        )}
      </div>
      {renderModals()}
    </main>
  );
}

export default EVMRawTransaction;
