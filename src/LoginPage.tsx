import { useOkto } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type TabType = "google" | "email" | "whatsapp" | "jwt";

export default function LoginPage() {
  const oktoClient = useOkto();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("google");

  const [email, setEmail] = useState(localStorage.getItem("okto_email") || "");
  const [phoneNo, setPhoneNo] = useState(
    localStorage.getItem("okto_phoneNo") || ""
  );
  const [jwt, setJwt] = useState(localStorage.getItem("okto_jwt") || "");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState(localStorage.getItem("okto_token") || "");
  const [status, setStatus] = useState(
    localStorage.getItem("okto_status") || "send_OTP"
  );

  useEffect(() => {
    if (oktoClient.isLoggedIn()) {
      navigate("/home");
      return;
    }

    const storedToken = localStorage.getItem("googleIdToken");
    if (storedToken) handleAuthenticate(storedToken);
  }, [oktoClient]);

  const handleAuthenticate = async (idToken: string) => {
    try {
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

  return (
    <main className="min-h-[90vh] bg-gray-900 flex flex-col items-center justify-center p-6 md:p-12">
      {/* Tab Navigation */}
      <div className="w-full max-w-md mb-6">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("google")}
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === "google"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Google
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === "email"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === "whatsapp"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setActiveTab("jwt")}
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === "jwt"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            JWT
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
          {activeTab === "google" && (
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
          {activeTab === "email" && (
            <div className="flex flex-col space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Email"
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={status === "verify_OTP"}
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
          {activeTab === "whatsapp" && (
            <div className="flex flex-col space-y-4">
              <input
                type="text"
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                placeholder="Enter your Phone Number"
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={status === "verify_OTP"}
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
          {activeTab === "jwt" && (
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
        </div>
      </div>

      {/* Optional direct navigation */}
      <button
        onClick={() => navigate("/home")}
        className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
      >
        Go to homepage
      </button>
    </main>
  );
}
