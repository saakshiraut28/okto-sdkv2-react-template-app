import { useOkto } from "@okto_web3/react-sdk";
import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const oktoClient = useOkto();
  const navigate = useNavigate();

  const [email, setEmail] = useState(localStorage.getItem("okto_email") || "");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState(localStorage.getItem("okto_token") || "");
  const [status, setStatus] = useState(localStorage.getItem("okto_status") || "send_OTP");

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
        const res = await oktoClient.loginUsingEmail(email, otp, token, (session: any) => {
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

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 md:p-12 space-y-6">
      {/* Google Login */}
      <section className="bg-black border border-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md flex flex-col items-center space-y-6">
        <h1 className="text-3xl font-bold text-white">Welcome to Okto</h1>
        <p className="text-gray-400 text-center">Sign in with your Google account</p>
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          theme="filled_black"
          size="large"
          shape="rectangular"
        />
      </section>

      {/* Email Login */}
      <section className="bg-black border border-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md flex flex-col items-center space-y-4">
        <h2 className="text-xl font-bold text-white">Email OTP Authentication</h2>
        <p className="text-white text-justify"> ⚠️ Note: Sending and resending OTP via email works as expected, but <strong>login using OTP is currently work in progress</strong></p>

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
      </section>

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
