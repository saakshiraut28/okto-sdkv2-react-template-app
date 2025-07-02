import React, { createContext, useState, useEffect } from "react";
import { Hash, Hex } from "@okto_web3/react-sdk";
import { STORAGE_KEY } from "../constants";

type Env = "staging" | "sandbox" | "production";
type authType = "google" | "email" | "whatsapp" | "jwt" | "webview";
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
  authMethod: authType;
  setAuthMethod: React.Dispatch<React.SetStateAction<authType>>;
}

const defaultConfig: Config = {
  mode: "sdk",
  apiUrl: "",
  environment: "sandbox",
  clientPrivateKey:
    "0x7a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b" as Hash, // sample address
  clientSWA: "0xAbCdEf01234567890AbCdEf01234567890AbCdEf" as Hex, // sample address
};

export const ConfigContext = createContext<ConfigContextType>({
  config: defaultConfig,
  setConfig: () => {},
  authMethod: "google",
  setAuthMethod: () => {},
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        return {
          mode: (parsed.mode || defaultConfig.mode) as Mode,
          apiUrl: (parsed.apiUrl || defaultConfig.apiUrl) as string,
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
      mode: defaultConfig.mode,
      apiUrl: defaultConfig.apiUrl,
      environment:
        import.meta.env.VITE_OKTO_ENVIRONMENT || defaultConfig.environment,
      clientPrivateKey: defaultConfig.clientPrivateKey,
      clientSWA: defaultConfig.clientSWA,
    };
  });
  const [authMethod, setAuthMethod] = useState<authType>(() => {
    const savedMethod = localStorage.getItem("okto_auth_method") as authType;
    if (savedMethod) return savedMethod;
    else return "google";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      localStorage.setItem("okto_auth_method", authMethod);
    } catch (error) {
      console.error("Error saving config to localStorage:", error);
    }
  }, [config, authMethod]);

  return (
    <ConfigContext.Provider
      value={{ config, setConfig, authMethod, setAuthMethod }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
