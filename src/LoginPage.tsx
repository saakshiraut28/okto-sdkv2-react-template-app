import { Hash, Hex, useOkto, useOktoWebView } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEY } from "./constants";
import { ConfigContext } from "./context/ConfigContext";

type Env = "staging" | "sandbox" | "production";
type Mode = "api" | "sdk";

interface Config {
  mode: Mode,
  apiUrl: string,
  environment: Env;
  clientPrivateKey: Hash;
  clientSWA: Hex;
}

interface ConfigContextType {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

type TabType = "google" | "email" | "whatsapp" | "jwt" | "webview";

export default function LoginPage() {
  const oktoClient = useOkto();
  const navigate = useNavigate();
  const { authMethod, setAuthMethod } = useContext(ConfigContext);
  const { config, setConfig } = useContext(ConfigContext);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { isModalOpen, authenticate } = useOktoWebView();

  // Initialize states with empty values
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [jwt, setJwt] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("send_OTP");

  // Load values from localStorage after component mounts
  useEffect(() => {
    setEmail(localStorage.getItem("okto_email") || "");
    setPhoneNo(localStorage.getItem("okto_phoneNo") || "");
    setJwt(localStorage.getItem("okto_jwt") || "");
    setToken(localStorage.getItem("okto_token") || "");
    setStatus(localStorage.getItem("okto_status") || "send_OTP");
  }, []);

  useEffect(() => {
    if (oktoClient.isLoggedIn()) {
      navigate("/home");
      return;
    }

    const storedToken = localStorage.getItem("googleIdToken");
    if (storedToken) handleAuthenticate(storedToken);
  }, [oktoClient]);

  // Update the handleConfigUpdate function
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

  // Update the handleResetConfig function
  const handleResetConfig = () => {
    const defaultConfig = {
      mode: ("sdk" as Mode),
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

  const handleAuthenticate = async (idToken: string) => {
    try {
      localStorage.removeItem("okto_session");
      const user = await oktoClient.loginUsingOAuth(
        { idToken, provider: "google" },
        (session: any) => {
          localStorage.setItem("okto_session", JSON.stringify(session));
        }
      );
      navigate("/home");
    } catch (error) {
      console.error("Authentication failed:", error);
      localStorage.removeItem("googleIdToken");
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    const idToken = credentialResponse.credential || "";
    if (idToken) {
      localStorage.setItem("googleIdToken", idToken);
      handleAuthenticate(idToken);
    }
  };

  const handleEmailAction = async () => {
    try {
      localStorage.removeItem("okto_session");
      if (!email) return alert("Enter a valid email");

      if (status === "send_OTP") {
        const res = await oktoClient.sendOTP(email, "email");
        setToken(res.token);
        setStatus("verify_OTP");
        console.log("OTP sent:", res);
      } else if (status === "resend_OTP") {
        const res = await oktoClient.resendOTP(email, token, "email");
        setToken(res.token);
        setStatus("verify_OTP");
        console.log("OTP resent:", res);
      } else if (status === "verify_OTP") {
        const res = await oktoClient.loginUsingEmail(
          email,
          otp,
          token,
          (session: any) => {
            localStorage.setItem("okto_session", JSON.stringify(session));
          }
        );
        console.log("OTP verified:", res);

        navigate("/home");
      }
    } catch (err) {
      console.error("Email login error:", err);
    }
  };

  const handleWhatsappAction = async () => {
    try {
      localStorage.removeItem("okto_session");
      if (!phoneNo) return alert("Enter a valid phone number");

      if (status === "send_OTP") {
        const res = await oktoClient.sendOTP(phoneNo, "whatsapp");
        setToken(res.token);
        setStatus("verify_OTP");
        console.log("OTP sent:", res);
      } else if (status === "resend_OTP") {
        const res = await oktoClient.resendOTP(phoneNo, token, "whatsapp");
        setToken(res.token);
        setStatus("verify_OTP");
        console.log("OTP resent:", res);
      } else if (status === "verify_OTP") {
        const res = await oktoClient.loginUsingWhatsApp(
          phoneNo,
          otp,
          token,
          (session: any) => {
            localStorage.setItem("okto_session", JSON.stringify(session));
          }
        );
        console.log("OTP verified:", res);

        navigate("/home");
      }
    } catch (err) {
      console.error("Whatsapp login error:", err);
    }
  };

  const handleJwtAction = async () => {
    try {
      localStorage.removeItem("okto_session");
      if (!jwt) return alert("Enter a valid Jwt token");

      const res = await oktoClient.loginUsingJWTAuthentication(
        jwt,
        (session: any) => {
          localStorage.setItem("okto_session", JSON.stringify(session));
        }
      );
      console.log("JWT login response:", res);

      navigate("/home");
    } catch (err) {
      console.error("Whatsapp login error:", err);
    }
  };

  const handleWebview = async () => {
    try {
      localStorage.removeItem("okto_session");
      const result = await authenticate({
        onSuccess(data) {
          console.log("login successfull. onSuccess function called", data);
        },
      });
      console.log("Authentication successful:", result);
      navigate("/home");
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  const resetValues = async () => {
    setEmail("");
    setPhoneNo("");
    setOtp("");
    setJwt("");
    setToken("");
    setStatus("send_OTP");
  };

  return (
    <main className="min-h-[90vh] bg-gray-900 flex flex-col items-center justify-center p-6 md:p-12">
      <div className="bg-black/50 border border-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl mb-6">
        {/* Config Button */}
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
      </div>

      {/* Tab Navigation */}
      <div className="w-full max-w-md mb-6">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => {
              setAuthMethod("google");
              resetValues();
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
              resetValues();
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
              resetValues();
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
              resetValues();
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
              resetValues();
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
            <div className="flex flex-col items-center space-y-4">
              <p className="text-gray-400 text-center">
                Sign in with your Google account
              </p>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                theme="filled_black"
                size="large"
                shape="rectangular"
              />
            </div>
          )}

          {/* Email Login */}
          {authMethod === "email" && (
            <div className="flex flex-col space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Email"
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {status === "verify_OTP" && (
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}

              <button
                onClick={handleEmailAction}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                {status === "verify_OTP" ? "Verify OTP" : "Send OTP"}
              </button>

              {status === "verify_OTP" && (
                <button
                  type="button"
                  onClick={() => setStatus("resend_OTP")}
                  className="text-sm text-blue-400 hover:underline text-center w-full"
                >
                  Resend OTP
                </button>
              )}

              <p className="text-gray-400 text-sm text-center">
                {status === "verify_OTP"
                  ? "Enter the OTP sent to your email"
                  : "We'll send you a login code"}
              </p>
            </div>
          )}

          {/* WhatsApp Login */}
          {authMethod === "whatsapp" && (
            <div className="flex flex-col space-y-4">
              <p className="text-gray-300 text-sm">
                Format:{" "}
                <code className="bg-gray-800 px-2 py-1 rounded text-blue-300">
                  &lt;10-digit number&gt;
                </code>{" "}
                <br />
                <span className="text-gray-400 text-xs">
                  Note: Country code IN is used by default
                </span>
              </p>
              <input
                type="tel"
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                placeholder="Enter your Phone Number"
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {status === "verify_OTP" && (
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}

              <button
                onClick={handleWhatsappAction}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                {status === "verify_OTP" ? "Verify OTP" : "Send OTP"}
              </button>

              {status === "verify_OTP" && (
                <button
                  type="button"
                  onClick={() => setStatus("resend_OTP")}
                  className="text-sm text-blue-400 hover:underline text-center w-full"
                >
                  Resend OTP
                </button>
              )}

              <p className="text-gray-400 text-sm text-center">
                {status === "verify_OTP"
                  ? "Enter the OTP sent to your phone number"
                  : "We'll send you a login code"}
              </p>
            </div>
          )}

          {/* JWT Token Login */}
          {authMethod === "jwt" && (
            <div className="flex flex-col space-y-4">
              <p className="text-gray-300 text-sm">
                Format:{" "}
                <code className="bg-gray-800 px-2 py-1 rounded text-blue-300">
                  Bearer &lt;jwt-token&gt;
                </code>
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={jwt}
                  onChange={(e) => setJwt(e.target.value)}
                  placeholder="Enter your Jwt Token"
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleJwtAction}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Verify JWT
              </button>
            </div>
          )}

          {/* Okto Onboarding Modal  */}
          {authMethod === "webview" && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-gray-400 text-center">
                Sign in with Okto Onboarding Modal
              </p>
              <button
                onClick={handleWebview}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Onboarding Modal
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
