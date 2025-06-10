"use client";
import { useState, useEffect } from "react";
import { rawRead, useOkto, getChains } from "@okto_web3/react-sdk";
import { useNavigate } from "react-router-dom";
import CopyButton from "../components/CopyButton";

function RawRead() {
  const oktoClient = useOkto();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"EVM" | "APTOS">("EVM");
  const [chains, setChains] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState("");

  // EVM state
  const [contractAddress, setContractAddress] = useState("");
  const [abiJson, setAbiJson] = useState("");
  const [argsJson, setArgsJson] = useState("");

  // Aptos state
  const [aptosFunction, setAptosFunction] = useState("");
  const [aptosTypeArgs, setAptosTypeArgs] = useState<string[]>([""]);
  const [aptosFuncArgs, setAptosFuncArgs] = useState<string[]>([""]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readResult, setReadResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    getChains(oktoClient)
      .then(setChains)
      .catch((err) => setError(`Failed to fetch chains: ${err.message}`));
  }, [oktoClient]);

  const handleContractRead = () => {
    if (mode === "EVM") return handleEvmContractRead();
    return handleAptosContractRead();
  };

  const handleEvmContractRead = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!contractAddress.startsWith("0x")) throw new Error("Invalid contract address");
      const abi = JSON.parse(abiJson);
      const args = JSON.parse(argsJson);

      const payload = {
        caip2Id: selectedChain,
        data: {
          contractAddress,
          abi,
          args,
        },
      };

      const result = await rawRead(oktoClient, payload);
      setReadResult(result);
      setShowResult(true);
    } catch (err: any) {
      setError(`EVM Read Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAptosContractRead = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!aptosFunction.trim()) throw new Error("Aptos function name is required");

      const payload = {
        caip2Id: selectedChain,
        data: {
          function: aptosFunction,
          typeArguments: aptosTypeArgs,
          functionArguments: aptosFuncArgs,
        },
      };

      const result = await rawRead(oktoClient, payload);
      setReadResult(result);
      setShowResult(true);
    } catch (err: any) {
      setError(`Aptos Read Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setError(null);
    setReadResult(null);
    setShowResult(false);
    setContractAddress("");
    setAbiJson("");
    setArgsJson("");
    setAptosFunction("");
    setAptosTypeArgs([""]);
    setAptosFuncArgs([""]);
  };

  if (showResult) {
    return (
      <div className="w-full bg-gray-900 min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-white text-center">Contract Read Result</h1>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="bg-gray-900 p-4 rounded">
              <CopyButton text={JSON.stringify(readResult, null, 2)} />
              <pre className="text-white text-sm overflow-auto">
                {JSON.stringify(readResult, null, 2)}
              </pre>
            </div>
            <button
              onClick={resetForm}
              className="mt-4 w-full p-3 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Read Another Contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/home")}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Home
        </button>

        <h1 className="text-2xl font-bold text-white text-center">Contract Read</h1>

        <p className="text-white text-center">
          Read data from smart contracts.{" "}
          <a
            className="underline text-indigo-300"
            href="https://docs.okto.tech/docs/react-sdk/rawRead"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          {/* Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Chain Type</label>
            <select
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
              value={mode}
              onChange={(e) => setMode(e.target.value as "EVM" | "APTOS")}
              disabled={isLoading}
            >
              <option value="EVM">EVM</option>
              <option value="APTOS">Aptos</option>
            </select>
          </div>

          {/* Network */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Network</label>
            <select
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select a network</option>
              {chains.map((chain) => (
                <option key={chain.chainId} value={chain.caipId}>
                  {chain.networkName} ({chain.caipId})
                </option>
              ))}
            </select>
          </div>

          {mode === "EVM" ? (
            <>
              {/* Contract Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contract Address</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>

              {/* ABI JSON */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Function ABI (JSON)</label>
                <textarea
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white h-36"
                  value={abiJson}
                  onChange={(e) => setAbiJson(e.target.value)}
                  placeholder='{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}'
                />
              </div>

              {/* Args JSON */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Args Object (JSON)</label>
                <textarea
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white h-28"
                  value={argsJson}
                  onChange={(e) => setArgsJson(e.target.value)}
                  placeholder={`e.g. {"account":"0xB7B8F759E8Bd293b91632100f53a45859832f463"}
`}
                />
              </div>
            </>
          ) : (
            <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Aptos Function</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                    value={aptosFunction}
                    onChange={(e) => setAptosFunction(e.target.value)}
                    placeholder="0x1::coin::balance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type Arguments</label>
                  {aptosTypeArgs.map((arg, i) => (
                    <input
                      key={i}
                      className="w-full mb-2 p-3 bg-gray-700 border border-gray-600 rounded text-white"
                      value={arg}
                      onChange={(e) => {
                        const updated = [...aptosTypeArgs];
                        updated[i] = e.target.value;
                        setAptosTypeArgs(updated);
                      }}
                      placeholder="0x1::aptos_coin::AptosCoin"
                    />
                  ))}
                  <button
                    onClick={() => setAptosTypeArgs([...aptosTypeArgs, ""])}
                    className="text-indigo-400 text-sm"
                  >
                    + Add Type Argument
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Function Arguments</label>
                  {aptosFuncArgs.map((arg, i) => (
                    <input
                      key={i}
                      className="w-full mb-2 p-3 bg-gray-700 border border-gray-600 rounded text-white"
                      value={arg}
                      onChange={(e) => {
                        const updated = [...aptosFuncArgs];
                        updated[i] = e.target.value;
                        setAptosFuncArgs(updated);
                      }}
                      placeholder="0x<user_address>"
                    />
                  ))}
                  <button
                    onClick={() => setAptosFuncArgs([...aptosFuncArgs, ""])}
                    className="text-indigo-400 text-sm"
                  >
                    + Add Function Argument
                  </button>
                </div>
            </>
          )}

          <button
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:bg-purple-800 disabled:opacity-50"
            onClick={handleContractRead}
            disabled={isLoading || !selectedChain}
          >
            {isLoading ? "Reading Contract..." : "Read Contract Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RawRead;
