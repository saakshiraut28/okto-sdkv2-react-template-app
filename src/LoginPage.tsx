import { ConfigContext } from "./context/ConfigContext";
import { useContext, useEffect } from "react";
import Configuration from "./components/Login/Configuration";
import EmailLogin from "./components/Login/EmailLogin";
import GoogleLogin from "./components/Login/GoogleLogin";
import WhatsappLogin from "./components/Login/WhatsappLogin";
import JWTLogin from "./components/Login/JWTLogin";
import WebViewLogin from "./components/Login/WebViewLogin";
import { useOkto } from "@okto_web3/react-sdk";
import { useNavigate } from "react-router-dom";

type TabType = "google" | "email" | "whatsapp" | "jwt" | "webview";

export default function LoginPage() {

  const { authMethod, setAuthMethod } = useContext(ConfigContext);
  const oktoClient = useOkto();
  const navigate = useNavigate();

  useEffect(()=>{
    if(oktoClient.isLoggedIn()) navigate("/");
    return;
  }, []);

  return (
    <main className="min-h-[90vh] bg-gray-900 flex flex-col items-center justify-center p-6 md:p-12">
      <div className="bg-black/50 border border-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl mb-6">
        <Configuration />
      </div>

      {/* Tab Navigation */}
      <div className="w-full max-w-md mb-6">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => {
              setAuthMethod("google");
            }}
            className={`flex-1 py-2 px-4 text-center ${authMethod === "google"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            Google
          </button>
          <button
            onClick={() => {
              setAuthMethod("email");
            }}
            className={`flex-1 py-2 px-4 text-center ${authMethod === "email"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            Email
          </button>
          <button
            onClick={() => {
              setAuthMethod("whatsapp");
            }}
            className={`flex-1 py-2 px-4 text-center ${authMethod === "whatsapp"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => {
              setAuthMethod("jwt");
            }}
            className={`flex-1 py-2 px-4 text-center ${authMethod === "jwt"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            JWT
          </button>
          <button
            onClick={() => {
              setAuthMethod("webview");
            }}
            className={`flex-1 py-2 px-4 text-center ${authMethod === "webview"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            Onboarding Modal
          </button>
        </div>
      </div>

      {/* Main Authentication Box */}
      <div className="bg-black border border-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Welcome to Okto
        </h1>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Google Login */}
          {authMethod === "google" && (
            <GoogleLogin />
          )}

          {/* Email Login */}
          {authMethod === "email" && (
            <EmailLogin />
          )}

          {/* WhatsApp Login */}
          {authMethod === "whatsapp" && (
            <WhatsappLogin />
          )}

          {/* JWT Token Login */}
          {authMethod === "jwt" && (
            <JWTLogin />
          )}

          {/* Okto Onboarding Modal  */}
          {authMethod === "webview" && (
            <WebViewLogin />
          )}
        </div>
      </div>
    </main>
  );
}
