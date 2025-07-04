import { useNavigate } from "react-router-dom";
import { useOktoWebView } from "@okto_web3/react-sdk";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "../../context/ConfigContext";

export default function WebViewLogin() {
  const navigate = useNavigate();
  const configContext = useContext(ConfigContext);
  const [mode, setMode] = useState<string>("sdk");
  const { isModalOpen, authenticate } = useOktoWebView();

  useEffect(() => {
    setMode(configContext.config.mode);
  }, [configContext]);

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

  return (
    <div className="flex flex-col items-center space-y-4">
      {mode === "api" ? (
        <p className="text-center text-white p-10">
          Onboarding modal login is not possible in API mode
        </p>
      ) : null}
      {mode === "sdk" ? (
        <>
          <p className="text-gray-400 text-center">
            Sign in with Okto Onboarding Modal
          </p>
          <button
            onClick={handleWebview}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Onboarding Modal
          </button>
        </>
      ) : null}
    </div>
  );
}
