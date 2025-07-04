import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOkto } from "@okto_web3/react-sdk";
import { ConfigContext } from "../../context/ConfigContext";
import * as authClient from "../../api/auth";
import type { Hex } from "viem";

export default function JWTLogin() {
  const [jwt, setJwt] = useState("");
  const [mode, setMode] = useState<string>("sdk");
  const [clientPK, setClientPK] = useState<Hex>("0x");
  const [clientSWA, setClientSWA] = useState<Hex>("0x");
  const [baseUrl, setBaseUrl] = useState<string>("");

  const navigate = useNavigate();
  const oktoClient = useOkto();
  const configContext = useContext(ConfigContext);

  useEffect(() => {
    setMode(configContext.config.mode);
    setClientPK(configContext.config.clientPrivateKey);
    setClientSWA(configContext.config.clientSWA);
    setBaseUrl(configContext.config.apiUrl);
  }, [configContext]);

  const handleJwtAction = async () => {
    try {
      localStorage.removeItem("okto_session");
      if (!jwt) return alert("Enter a valid Jwt token");

      if (mode === "api") {
        const provider = "jwt";
        const res = await authClient.authenticate(
          baseUrl,
          jwt,
          provider,
          clientPK,
          clientSWA
        );
        localStorage.setItem("okto_session", JSON.stringify(res.sessionConfig));
      } else if (mode === "sdk") {
        await oktoClient.loginUsingJWTAuthentication(jwt, (session: any) => {
          localStorage.setItem("okto_session", JSON.stringify(session));
        });
      }
      navigate("/home");
    } catch (err) {
      console.error("JWT login error:", err);
    }
  };

  return (
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
  );
};
