import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { OktoProvider } from "@okto_web3/react-sdk";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  StrictMode,
} from "react";
import { Buffer } from "buffer";
import { BrowserRouter } from "react-router-dom";

// Ensure Buffer is available globally
(globalThis as any).Buffer = Buffer;

// Define the config type and context type
const defaultConfig = {
  environment: "sandbox",
  vendorPrivKey: "",
  vendorSWA: "",
};

const config = {
  environment: import.meta.env.VITE_ENVIRONMENT || defaultConfig.environment,
  vendorPrivKey:
    import.meta.env.VITE_VENDOR_PRIVATE_KEY || defaultConfig.vendorPrivKey,
  vendorSWA: import.meta.env.VITE_VENDOR_SWA,
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const STORAGE_KEY = "okto_config";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <OktoProvider config={config}>
          <App />
        </OktoProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
