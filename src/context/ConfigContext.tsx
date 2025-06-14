import React, { createContext, useState, useEffect } from "react";
import { Hash, Hex } from "@okto_web3/react-sdk";
import { STORAGE_KEY } from "../constants";

type Env = "staging" | "sandbox" | "production";

interface Config {
  environment: Env;
  clientPrivateKey: Hash;
  clientSWA: Hex;
}

interface ConfigContextType {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

const defaultConfig: Config = {
  environment: "sandbox",
  clientPrivateKey: "" as Hash,
  clientSWA: "" as Hex,
};

export const ConfigContext = createContext<ConfigContextType>({
  config: defaultConfig,
  setConfig: () => {},
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        return {
          environment: (parsed.environment || defaultConfig.environment) as Env,
          clientPrivateKey:
            parsed.clientPrivateKey || defaultConfig.clientPrivateKey,
          clientSWA: parsed.clientSWA || defaultConfig.clientSWA,
        };
      }
    } catch (error) {
      console.error("Error loading config from localStorage:", error);
    }
    return {
      environment:
        import.meta.env.VITE_OKTO_ENVIRONMENT || defaultConfig.environment,
      clientPrivateKey:
        import.meta.env.VITE_OKTO_CLIENT_PRIVATE_KEY ||
        defaultConfig.clientPrivateKey,
      clientSWA:
        import.meta.env.VITE_OKTO_CLIENT_SWA || defaultConfig.clientSWA,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error("Error saving config to localStorage:", error);
    }
  }, [config]);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}
