import { OktoProvider } from "@okto_web3/react-sdk";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { StrictMode, useContext } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import Navbar from "./components/Navbar.tsx";
import { ConfigProvider, ConfigContext } from "./context/ConfigContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AppWithProviders() {
  const { config } = useContext(ConfigContext);
  return (
    <OktoProvider config={config}>
      <Navbar />
      <App />
    </OktoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ConfigProvider>
        <AppWithProviders />
      </ConfigProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>
);
