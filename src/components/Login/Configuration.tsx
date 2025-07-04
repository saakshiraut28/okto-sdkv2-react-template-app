import { Hash, Hex } from "@okto_web3/react-sdk";
import { ConfigContext } from "../../context/ConfigContext";
import { useContext, useState } from "react";
import { STORAGE_KEY } from "../../constants";

type Env = "staging" | "sandbox" | "production";
type Mode = "api" | "sdk";

interface Config {
  mode: Mode;
  apiUrl: string;
  environment: Env;
  clientPrivateKey: Hash;
  clientSWA: Hex;
}

interface ConfigContextType {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export default function Configuration() {
  const { config, setConfig } = useContext(ConfigContext);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleConfigUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setConfig({
      mode: (formData.get("mode") as Mode) || "sdk",
      apiUrl: (formData.get("apiUrl") as string) || "",
      environment: (formData.get("environment") as Env) || "sandbox",
      clientPrivateKey:
        (formData.get("clientPrivateKey") as `0x${string}`) || "",
      clientSWA: (formData.get("clientSWA") as `0x${string}`) || "",
    });
    setIsConfigOpen(false);
  };

  const handleResetConfig = () => {
    const defaultConfig = {
      mode: "sdk" as Mode,
      apiUrl: "",
      environment: import.meta.env.VITE_OKTO_ENVIRONMENT || "sandbox",
      clientPrivateKey: import.meta.env.VITE_OKTO_CLIENT_PRIVATE_KEY || "",
      clientSWA: import.meta.env.VITE_OKTO_CLIENT_SWA || "",
    };
    setConfig(defaultConfig);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error removing config from localStorage:", error);
    }
    setIsConfigOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Configuration</h2>
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
        >
          {isConfigOpen ? "Close" : "Update"}
        </button>
      </div>

      {!isConfigOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-sm text-gray-400">
            <p className="flex items-center">
              <span>Mode:</span>
              <span className="text-white ml-2">{config.mode}</span>
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <p className="flex items-center">
              <span>API URL:</span>
              <span className="text-white ml-2">{config.apiUrl}</span>
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <p className="flex items-center">
              <span>Environment:</span>
              <span className="text-white ml-2">{config.environment}</span>
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <p className="flex items-center">
              <span>Client Private Key:</span>
              <span className="text-white ml-2">
                {config.clientPrivateKey ? "••••••••" : "Not set"}
              </span>
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <p className="flex items-center">
              <span>Client SWA:</span>
              <span className="text-white ml-2">
                {config.clientSWA ? "••••••••" : "Not set"}
              </span>
            </p>
          </div>
        </div>
      )}

      {isConfigOpen && (
        <form onSubmit={handleConfigUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Mode
              </label>
              <select
                name="mode"
                defaultValue={config.mode}
                className="w-full p-2 text-sm border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="sdk">SDK</option>
                <option value="api">API</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                API URL
              </label>
              <input
                type="text"
                name="apiUrl"
                placeholder="Enter your API URL"
                className="w-full p-2 text-sm border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Environment
              </label>
              <select
                name="environment"
                defaultValue={config.environment}
                className="w-full p-2 text-sm border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="sandbox">Sandbox</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Client Private Key
              </label>
              <input
                type="text"
                required
                name="clientPrivateKey"
                placeholder="Enter your client private key"
                className="w-full p-2 text-sm border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Client SWA
              </label>
              <input
                type="text"
                name="clientSWA"
                defaultValue={config.clientSWA}
                className="w-full p-2 text-sm border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleResetConfig}
              className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      )}
    </>
  );
}
