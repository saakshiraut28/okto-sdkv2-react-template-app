"use client";
import { useState, useEffect, useCallback, useContext } from "react";
import {
  Address,
  getOrdersHistory,
  getPortfolio,
  getTokens,
  useOkto,
  UserPortfolioData,
} from "@okto_web3/react-sdk";
import { tokenTransfer } from "@okto_web3/react-sdk/userop";
import { tokenTransfer as tokenTransferSdk } from "@okto_web3/react-sdk/userop";
import { getChains } from "@okto_web3/react-sdk";
import { useNavigate } from "react-router-dom";
import CopyButton from "../components/CopyButton";
import ViewExplorerURL from "../components/ViewExplorerURL";
import { ConfigContext } from "../context/ConfigContext";
import * as intent from "../api/intent";
import * as explorer from "../api/explorer";

// Types
interface TokenOption {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  caipId: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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

function TwoStepTokenTransfer() {
  const oktoClient = useOkto();
  const navigate = useNavigate();
  const { config } = useContext(ConfigContext);

  // Form state
  const [mode, setMode] = useState<"EVM" | "APTOS" | "SOLANA">("EVM");
  const [chains, setChains] = useState<any[]>([]);
  const [tokens, setTokens] = useState<TokenOption[]>([]);
  const [portfolio, setPortfolio] = useState<UserPortfolioData>();
  const [portfolioBalance, setPortfolioBalance] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [feePayer, setFeePayer] = useState<string>("");
  const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<{
    balance: string;
    usdtBalance: string;
    inrBalance: string;
  } | null>(null);

  // Transaction state
  const [jobId, setJobId] = useState<string | null>(null);
  const [estimateResponse, setEstimateResponse] = useState<any | null>(null);
  const [userOp, setUserOp] = useState<any | null>(null);
  const [signedUserOp, setSignedUserOp] = useState<any | null>(null);
  const [orderHistory, setOrderHistory] = useState<any | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Helper functions
  const showModal = (modal: string) => setActiveModal(modal);
  const closeAllModals = () => setActiveModal(null);

  const resetForm = () => {
    setSelectedToken("");
    setAmount("");
    setRecipient("");
    setFeePayer("");
    setUserOp(null);
    setSignedUserOp(null);
    setJobId(null);
    setOrderHistory(null);
    setExplorerUrl(null);
    setError(null);
    closeAllModals();
  };

  const validateFormData = () => {
    const token = tokens.find((t) => t.symbol === selectedToken);
    if (selectedChain && sponsorshipEnabled) {
      if (!feePayer || !feePayer.startsWith("0x"))
        throw new Error("Please enter a valid feePayer address");
    }
    if (!token) throw new Error("Please select a valid token");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      throw new Error("Please enter a valid amount");

    if (!recipient) throw new Error("Please enter a valid recipient address");

    if (mode === "EVM") {
      if (!recipient.startsWith("0x"))
        throw new Error("Please enter a valid recipient address");
    }
    return {
      amount: BigInt(amount),
      recipient: recipient as Address,
      token: token.address as Address,
      caip2Id: selectedChain,
    };
  };

  // Helper to get sessionConfig for API mode
  const getSessionConfig = () => {
    const session = localStorage.getItem("okto_session");
    return JSON.parse(session || "{}");
  };

  // Data fetching
  useEffect(() => {
    const fetchChains = async () => {
      try {
        let chainsData;
        if (config.mode === "api") {
          const sessionConfig = getSessionConfig();
          const res = await explorer.getChains(config.apiUrl, sessionConfig);
          chainsData = res.data.network;
        } else {
          chainsData = await getChains(oktoClient);
        }
        setChains(chainsData);
      } catch (error: any) {
        console.error("Error fetching chains:", error);
        setError(`Failed to fetch chains: ${error.message}`);
      }
    };
    fetchChains();
  }, [oktoClient, config]);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!selectedChain) {
        setTokens([]);
        return;
      }
      setLoadingTokens(true);
      setError(null);
      try {
        let tokensData;
        if (config.mode === "api") {
          const sessionConfig = getSessionConfig();
          const res = await explorer.getTokens(config.apiUrl, sessionConfig);
          tokensData = res.data.tokens;
          console.log("API Tokens Data:", res.data.tokens);
        } else {
          tokensData = await getTokens(oktoClient);
        }
        const filteredTokens = tokensData
          .filter(
            (token: any) => (token.caipId || token.caip_id) === selectedChain
          )
          .map((token: any) => ({
            address: token.address,
            symbol: token.symbol,
            name: token.short_name || token.shortName || token.name,
          decimals: parseInt(token.decimals), // Ensure decimals is a number
          caipId: token.caipId || token.caip_id,
        }));
        setTokens(filteredTokens);
      } catch (error: any) {
        console.error("Error fetching tokens:", error);
        setError(`Failed to fetch tokens: ${error.message}`);
      } finally {
        setLoadingTokens(false);
      }
    };
    fetchTokens();
  }, [selectedChain, oktoClient, config]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        let data;
        if (config.mode === "api") {
          const sessionConfig = getSessionConfig();
          console.log("Session Config:", sessionConfig);
          const res = await explorer.getPortfolio(config.apiUrl, sessionConfig);
          console.log("Portfolio response in API mode:", res.data);
          data = res.data;
          data.groupTokens = data.group_tokens;
        } else {
          data = await getPortfolio(oktoClient);
        }
        setPortfolio(data);

      if (data?.groupTokens && tokens.length > 0) {
        const tokenBalanceMap = new Map();

        // Build comprehensive token info maps - use composite key (symbol + caipId)
        const tokenInfoMap = new Map();
        const selectedChainTokens = new Set();
        const caipIdToNetworkMap = new Map();

        tokens.forEach((t) => {
          const compositeKey = `${t.symbol}_${t.caipId}`;
          tokenInfoMap.set(compositeKey, {
            decimals: t.decimals,
            address: t.address,
            name: t.name,
            caipId: t.caipId,
            symbol: t.symbol
          });
          selectedChainTokens.add(t.symbol);
        });

        // Build caipId to networkId mapping from the original tokens data
        const allTokensData = config.mode === "api" ?
          (await explorer.getTokens(config.apiUrl, getSessionConfig())).data.tokens :
          await getTokens(oktoClient);

        allTokensData.forEach((token: any) => {
          const caipId = token.caipId || token.caip_id;
          const networkId = token.networkId || token.network_id;
          const networkName = token.networkName || token.network_name;
          if (caipId && networkId) {
            caipIdToNetworkMap.set(caipId, { networkId, networkName });
          }
        });

        // Get the target network info for the selected chain
        const selectedChainNetworkInfo = caipIdToNetworkMap.get(selectedChain);

        data.groupTokens.forEach((group: any) => {
          // Only process tokens that belong to the selected chain
          const groupNetworkId = group.networkId;
          const groupNetworkName = group.networkName;

          // Skip if this group doesn't belong to the selected chain's network
          if (!selectedChainNetworkInfo ||
            (groupNetworkId !== selectedChainNetworkInfo.networkId &&
              groupNetworkName !== selectedChainNetworkInfo.networkName)) {
            return;
          }

          // Handle individual tokens (aggregationType === "token")
          if (group.aggregationType === "token" && group.symbol) {
            // Only process if this token symbol exists on selected chain
            if (!selectedChainTokens.has(group.symbol)) {
              return;
            }

            const compositeKey = `${group.symbol}_${selectedChain}`;
            const tokenInfo = tokenInfoMap.get(compositeKey);
            let formattedBalance = group.viewBalance || "0";

            // If viewBalance is not available, calculate from raw balance
            if (!group.viewBalance && group.balance && tokenInfo?.decimals) {
              const rawBalance = typeof group.balance === 'string' ?
                parseFloat(group.balance) : group.balance;
              formattedBalance = (rawBalance / Math.pow(10, tokenInfo.decimals)).toString();
            }

            tokenBalanceMap.set(group.symbol, {
              balance: parseFloat(formattedBalance) || 0,
              usdtBalance: parseFloat(group.holdingsPriceUsdt || group.holdings_price_usdt || "0"),
              inrBalance: parseFloat(group.holdingsPriceInr || group.holdings_price_inr || "0"),
              rawBalance: group.balance,
              viewBalance: group.viewBalance,
              tokenInfo: tokenInfo,
              networkName: groupNetworkName,
              networkId: groupNetworkId
            });
          }

          // Handle grouped tokens (aggregationType === "group")
          if (group.aggregationType === "group" && group.tokens && group.tokens.length > 0) {
            group.tokens.forEach((token: any) => {
              // Only process if this token symbol exists on selected chain
              if (!selectedChainTokens.has(token.symbol)) {
                return;
              }

              const compositeKey = `${token.symbol}_${selectedChain}`;
              const tokenInfo = tokenInfoMap.get(compositeKey);
              let formattedBalance = token.viewBalance || "0";

              // If viewBalance is not available, calculate from raw balance
              if (!token.viewBalance && token.balance && tokenInfo?.decimals) {
                const rawBalance = typeof token.balance === 'string' ?
                  parseFloat(token.balance) : token.balance;
                formattedBalance = (rawBalance / Math.pow(10, tokenInfo.decimals)).toString();
              }

              tokenBalanceMap.set(token.symbol, {
                balance: parseFloat(formattedBalance) || 0,
                usdtBalance: parseFloat(token.holdingsPriceUsdt || token.holdings_price_usdt || "0"),
                inrBalance: parseFloat(token.holdingsPriceInr || token.holdings_price_inr || "0"),
                rawBalance: token.balance,
                viewBalance: token.viewBalance,
                tokenInfo: tokenInfo,
                networkName: groupNetworkName,
                networkId: groupNetworkId
              });
            });
          }

          // Handle group-level balance (for tokens that are grouped but display group balance)
          if (group.aggregationType === "group" && group.symbol && !group.tokens) {
            // Only process if this token symbol exists on selected chain
            if (!selectedChainTokens.has(group.symbol)) {
              return;
            }

            const compositeKey = `${group.symbol}_${selectedChain}`;
            const tokenInfo = tokenInfoMap.get(compositeKey);
            let formattedBalance = group.viewBalance || group.balance || "0";

            // Convert from raw balance if needed
            if (group.balance && !group.viewBalance && tokenInfo?.decimals) {
              const rawBalance = typeof group.balance === 'string' ?
                parseFloat(group.balance) : group.balance;
              formattedBalance = (rawBalance / Math.pow(10, tokenInfo.decimals)).toString();
            }

            tokenBalanceMap.set(group.symbol, {
              balance: parseFloat(formattedBalance) || 0,
              usdtBalance: parseFloat(group.holdingsPriceUsdt || group.holdings_price_usdt || "0"),
              inrBalance: parseFloat(group.holdingsPriceInr || group.holdings_price_inr || "0"),
              rawBalance: group.balance,
              viewBalance: group.viewBalance,
              tokenInfo: tokenInfo,
              networkName: groupNetworkName,
              networkId: groupNetworkId
            });
          }
        });

        // Set balance for selected token
        if (selectedToken && tokenBalanceMap.has(selectedToken)) {
          setTokenBalance(tokenBalanceMap.get(selectedToken));
        } else {
          setTokenBalance(null);
        }

        // Set portfolio balance array
        setPortfolioBalance(
          Array.from(tokenBalanceMap.entries())
            .map(([symbol, data]) => ({
              symbol,
              ...data,
            }))
            .filter(item => item.balance > 0 || item.usdtBalance > 0 || item.inrBalance > 0) // Only show tokens with balance
        );

        console.log("Processed token balances:", Array.from(tokenBalanceMap.entries()));
      }
    } catch (error: any) {
      console.error("Error fetching portfolio:", error);
      setError(`Failed to fetch portfolio: ${error.message}`);
    }
  };

  // Only fetch portfolio if tokens are loaded
  if (tokens.length > 0) {
    fetchPortfolio();
  }
}, [oktoClient, selectedToken, config, tokens]); // Added tokens as dependency

  // handle network change
  const handleNetworkChange = (e: any) => {
    const selectedCaipId = e.target.value;
    setSelectedChain(selectedCaipId);
    setSelectedToken("");
    setTokenBalance(null);

    const selectedChainObj = chains.find(
      (chain) => (chain.caipId || chain.caip_id) === selectedCaipId
    );
    setSponsorshipEnabled(
      selectedChainObj?.sponsorshipEnabled ??
        selectedChainObj?.sponsorship_enabled ??
        false
    );
  };

  // Function to handle token selection
  const handleTokenSelect = (symbol: string) => {
    setSelectedToken(symbol);
    if (portfolioBalance) {
      const tokenData = portfolioBalance.find((item) => item.symbol === symbol);
      setTokenBalance(tokenData || null);
    }
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
        // Use items array and filter by intent_id
        orders = (res.data?.items || []).filter(
          (o: any) => (o.intent_id || o.intentId) === intentId
        );
      } else {
        orders = await getOrdersHistory(oktoClient, {
          intentId,
          intentType: "TOKEN_TRANSFER",
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
          intentType: "TOKEN_TRANSFER",
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

  const handleTransferToken = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const transferParams = validateFormData();

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

      let jobId;
      if (config.mode === "api") {
        // API mode: use intent.ts endpoint
        const session = localStorage.getItem("okto_session");
        const sessionConfig = JSON.parse(session || "{}");
        const res = await intent.tokenTransfer(
          config.apiUrl,
          transferParams.caip2Id,
          transferParams.recipient,
          transferParams.token,
          transferParams.amount.toString(),
          sessionConfig,
          config.clientSWA,
          config.clientPrivateKey,
          sponsorshipEnabled ? feePayer : undefined
        );
        jobId = res.data?.jobId;
      } else {
        // SDK mode: use SDK
        if (selectedChain && sponsorshipEnabled) {
          jobId = await tokenTransferSdk(
            oktoClient,
            transferParams,
            feePayer as Address
          );
        } else {
          jobId = await tokenTransferSdk(oktoClient, transferParams);
        }
      }
      setJobId(jobId);
      await handleGetOrderHistory(jobId ? jobId : undefined);
      showModal("jobId");
      console.log("Transfer jobId:", jobId);
    } catch (error: any) {
      console.error("Error in token transfer:", error);
      setError(`Error in token transfer: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenTransferEstimate = async () => {
    if (config.mode == "sdk") return;
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
      const transferParams = validateFormData();
      let estimateResponse;

      // API mode: use intent.ts endpoint
      const session = localStorage.getItem("okto_session");
      const sessionConfig = JSON.parse(session || "{}");
      const res = await intent.tokenTransferEstimate(
        config.apiUrl,
        transferParams.caip2Id,
        transferParams.recipient,
        transferParams.token,
        transferParams.amount.toString(),
        sessionConfig,
        config.clientSWA,
        config.clientPrivateKey,
        sponsorshipEnabled ? feePayer : undefined
      );
      estimateResponse = res.data;

      setEstimateResponse(estimateResponse);
      showModal("estimate");
      console.log("Estimate Response:", estimateResponse);
    } catch (error: any) {
      console.error("Error in token transfer estimate:", error);
      setError(`Error in token transfer estimate: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenTransferExecuteAfterEstimate = async () => {
    if (config.mode == "sdk") return;
    if (!estimateResponse) {
      setError("No estimate transaction to execute");
      return;
    }

    setIsLoading(true);
    setError(null);
    let jobId;

    try {
      // API mode: use intent.ts endpoint
      const session = localStorage.getItem("okto_session");
      const sessionConfig = JSON.parse(session || "{}");
      const res = await intent.tokenTransferExecuteAfterEstimate(
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

  const handleTokenTransferUserOp = async () => {
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
      const transferParams = validateFormData();
      let userOp;
      if (config.mode === "sdk") {
        if (selectedChain && sponsorshipEnabled) {
          userOp = await tokenTransfer(
            oktoClient,
            transferParams,
            feePayer as Address
          );
        } else {
          userOp = await tokenTransfer(oktoClient, transferParams);
        }
      } else if (config.mode === "api") {
        // API mode: use intent.tokenTransferUserOp
        const session = localStorage.getItem("okto_session");
        const sessionConfig = JSON.parse(session || "{}");
        const res = await intent.tokenTransferUserOp(
          config.apiUrl,
          transferParams.caip2Id,
          transferParams.recipient,
          transferParams.token,
          transferParams.amount.toString(),
          sessionConfig,
          config.clientSWA,
          config.clientPrivateKey,
          sponsorshipEnabled ? feePayer : undefined
        );
        userOp = res;
      }
      setUserOp(userOp);
      showModal("unsignedOp");
      console.log("UserOp:", userOp);
    } catch (error: any) {
      console.error("Error in token transfer:", error);
      setError(`Error in creating user operation: ${error.message}`);
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
      console.error("Error in signing the userop:", error);
      setError(`Error in signing transaction: ${error.message}`);
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
      console.error("Error in executing the userop:", error);
      setError(`Error in executing transaction: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render form fields
  const renderForm = () => (
    <div className="space-y-4 bg-black  p-6 rounded-lg shadow-xl border border-gray-800">
      {/* Chain Type */}
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
          <option value="APTOS">APTOS</option>
          <option value="SOLANA">SOLANA</option>
        </select>
      </div>

      {mode === "SOLANA" && (
        <p className="mt-2 text-sm text-gray-300 border border-yellow-700 p-2 my-2">
          ⚠️ <strong>For Solana Mainnet & Devnet:</strong> Sponsorship is
          mandatory, and nonce wallets must be created manually.
        </p>
      )}

      {/* Network Selection */}
      <div>
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
          {chains &&
            Array.isArray(chains) &&
            chains.map((chain) => (
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
            : "⚠️ Sponsorship is not activated for this chain, the user must hold native tokens to proceed with the transfer. You can get the token from the respective faucets if using testnets"}
        </p>
      )}

      {/* Feepayer address  */}
      {selectedChain && sponsorshipEnabled && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Feepayer Address
          </label>
          <input
            type="text"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
            value={feePayer}
            onChange={(e) => setFeePayer(e.target.value)}
            placeholder="0x..."
            disabled={isLoading}
          />
        </div>
      )}

      {/* Token Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Select Token
        </label>
        <select
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
          value={selectedToken}
          onChange={(e) => handleTokenSelect(e.target.value)}
          disabled={isLoading || loadingTokens || !selectedChain}
        >
          <option value="" disabled>
            {loadingTokens
              ? "Loading tokens..."
              : !selectedChain
                ? "Select a network first"
                : tokens.length === 0
                  ? "No tokens available"
                  : "Select a token"}
          </option>
          {tokens.map((token) => (
            <option
              key={`${token.caipId}-${token.address}`}
              value={token.symbol}
            >
              {token.symbol} - {token.address || "native"}
            </option>
          ))}
        </select>
      </div>

      {/* Amount Field */}
      <div>
        <label className="flex justify-between block text-sm font-medium text-gray-300 mb-1">
          <p>Amount (in smallest unit):</p>
          <p>
            {selectedChain && (
              <>
                Balance:{" "}
                {selectedToken &&
                portfolioBalance?.find((pb) => pb.symbol === selectedToken)
                  ?.balance !== undefined
                  ? Number(
                      portfolioBalance.find((pb) => pb.symbol === selectedToken)
                        ?.balance
                    ).toFixed(8)
                  : "N/A"}{" "}
                &nbsp; INR:{" "}
                {(selectedToken &&
                  portfolioBalance?.find((pb) => pb.symbol === selectedToken)
                    ?.inrBalance) ||
                  "N/A"}{" "}
                &nbsp; USDT:{" "}
                {(selectedToken &&
                  portfolioBalance?.find((pb) => pb.symbol === selectedToken)
                    ?.usdtBalance) ||
                  "N/A"}
              </>
            )}
          </p>
        </label>
        <input
          type="text"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount in smallest unit (e.g., wei)"
          disabled={isLoading}
        />
        <small className="text-gray-400">
          {selectedToken &&
            tokens.find((t) => t.symbol === selectedToken)?.decimals &&
            `This token has ${tokens.find((t) => t.symbol === selectedToken)?.decimals} decimals`}
        </small>
      </div>

      {/* Recipient Address */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Recipient Address
        </label>
        <input
          type="text"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Valid recipient address for selected network"
          disabled={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-2">
        <button
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-blue-800 disabled:opacity-50"
          onClick={handleTransferToken}
          disabled={
            isLoading ||
            !selectedChain ||
            !selectedToken ||
            !amount ||
            !recipient
          }
        >
          {isLoading ? "Processing..." : "Transfer Token (Direct Execute)"}
        </button>
        <button
          className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:bg-purple-800 disabled:opacity-50"
          onClick={handleTokenTransferUserOp}
          disabled={
            isLoading ||
            !selectedChain ||
            !selectedToken ||
            !amount ||
            !recipient
          }
        >
          {isLoading ? "Processing..." : "Create Token Transfer UserOp"}
        </button>
      </div>
      {config.mode === "api" ? (
        <button
          className="w-full p-3 block bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:bg-purple-800 disabled:opacity-50"
          onClick={handleTokenTransferEstimate}
          disabled={
            isLoading ||
            !selectedChain ||
            !selectedToken ||
            !amount ||
            !recipient
          }
        >
          {isLoading ? "Processing..." : "Token Transfer (Estimate + Execute)"}
        </button>
      ) : null}
    </div>
  );

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
            <CopyButton
              text={typeof jobId === "string" ? jobId : JSON.stringify(jobId)}
            />
            <p className="font-mono break-all">
              {JSON.stringify(jobId, null, 2)}
            </p>
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
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 mb-1">Summary:</p>
            <ul className="space-y-1">
              <li>
                <span className="text-gray-400">Token:</span> {selectedToken}
              </li>
              <li>
                <span className="text-gray-400">Amount:</span> {amount}
              </li>
              <li>
                <span className="text-gray-400">Recipient:</span> {recipient}
              </li>
              <li>
                <span className="text-gray-400">Network:</span>
                {selectedChain}
              </li>
            </ul>
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

      {/* Estimate Transaction Modal */}
      <Modal
        isOpen={activeModal === "estimate"}
        onClose={closeAllModals}
        title="Review Transaction"
      >
        <div className="space-y-4 text-white">
          {estimateResponse ? (
            <>
              <p>Estimate details for your transaction.</p>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-300 mb-1">
                  Estimate Transaction Details:
                </p>
                <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-80">
                  <CopyButton
                    text={JSON.stringify(estimateResponse, null, 2)}
                  />
                  <pre>{JSON.stringify(estimateResponse, null, 2)}</pre>
                </div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-300 mb-1">Summary:</p>
                <ul className="space-y-1">
                  <li>
                    <span className="text-gray-400">Token:</span>{" "}
                    {selectedToken}
                  </li>
                  <li>
                    <span className="text-gray-400">Amount:</span> {amount}
                  </li>
                  <li>
                    <span className="text-gray-400">Recipient:</span>{" "}
                    {recipient}
                  </li>
                  <li>
                    <span className="text-gray-400">Network:</span>
                    {selectedChain}
                  </li>
                </ul>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-300 mb-1">UserOp:</p>
                <div className="bg-gray-900 p-2 rounded font-mono text-sm overflow-auto max-h-80">
                  <CopyButton
                    text={JSON.stringify(estimateResponse.userOps, null, 2)}
                  />
                  <pre>{JSON.stringify(estimateResponse.userOps, null, 2)}</pre>
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <button
                  className="p-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors w-full"
                  onClick={handleTokenTransferExecuteAfterEstimate}
                  disabled={isLoading}
                >
                  {isLoading ? "Executing..." : "Execute (UserOp)"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400">No estimate available.</p>
          )}
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
    </>
  );

  return (
    <div className="w-full bg-gray-900 min-h-screen">
      <div className="flex flex-col w-full max-w-2xl mx-auto p-6 space-y-6 bg-gray-900 rounded-lg shadow-xl justify-center items-center">
        <button
          onClick={() => navigate("/home")}
          className="w-fit py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black mb-8"
        >
          Home
        </button>
        <h1 className="text-2xl font-bold text-white text-center">
          Token Transfer
        </h1>
        <p className="text-white font-regular text-lg mb-6">
          For a detailed overview of Token Transfer intent, refer to our
          documentation on{" "}
          <a
            className="underline text-indigo-300"
            href="https://docs.okto.tech/docs/react-sdk/tokenTransfer"
            target="_blank"
            rel="noopener noreferrer"
          >
            Token Transfer
          </a>
          .
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {renderForm()}
      </div>
      {renderModals()}
    </div>
  );
}

export default TwoStepTokenTransfer;
