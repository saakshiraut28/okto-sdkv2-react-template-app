import { AppleLoginButton } from "react-social-login-buttons";
import { useOkto } from "@okto_web3/react-sdk";
import { useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "../../context/ConfigContext";
import * as authClient from "../../api/auth";
import type { Hex } from "viem";
import axios from "axios";

const REDIRECT_URI =
  "https://public-okto-react-sdk-template.vercel.app/auth/callback/apple";

function getAppleOauthUrl() {
  const AUTH_URL = "https://appleid.apple.com/auth/authorize";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: "tech.okto.si",
    redirect_uri: REDIRECT_URI,
    scope: "",
    state: "state_" + Math.random().toString(36).substring(2),
    response_mode: "query",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export default function AppleLogin() {
  const oktoClient = useOkto();
  const navigate = useNavigate();
  const configContext = useContext(ConfigContext);

  const [mode, setMode] = useState<string>("sdk");
  const [clientPK, setClientPK] = useState<Hex>("0x");
  const [clientSWA, setClientSWA] = useState<Hex>("0x");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [provider, setProvider] = useState("");
  const [profile, setProfile] = useState<any>();

  useEffect(() => {
    setMode(configContext.config.mode);
    setClientPK(configContext.config.clientPrivateKey);
    setClientSWA(configContext.config.clientSWA);
    setBaseUrl(configContext.config.apiUrl);
  }, [configContext]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {mode === "sdk" ? (
        <p className="text-center text-white p-6">
          Login is currently not supported in sdk mode
        </p>
      ) : null}{" "}
      {mode === "api" ? (
        <>
          <p className="text-gray-400 text-center">
            Sign in with your Apple account
          </p>
          <a href={getAppleOauthUrl()}>
            <AppleLoginButton />
          </a>
        </>
      ) : null}
    </div>
  );
}

export function AppleAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const configContext = useContext(ConfigContext);
  const oktoClient = useOkto();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code) {
      const mode = configContext.config.mode;
      if (mode === "sdk") {
        alert("Login is currently not supported in sdk mode");
        navigate("/");
        return;
      }
      axios
        .post(
          "https://public-okto-express-template.up.railway.app/api/auth/callback/apple",
          {
            code,
            state,
          }
        )
        .then(async (res) => {
          const { id_token } = res.data.data;
          const mode = configContext.config.mode;
          const baseUrl = configContext.config.apiUrl;
          const clientPK = configContext.config.clientPrivateKey;
          const clientSWA = configContext.config.clientSWA;
          try {
            if (mode === "api") {
              const provider = "apple";
              const oktoRes = await authClient.authenticate(
                baseUrl,
                id_token,
                provider,
                clientPK,
                clientSWA
              );
              if (oktoRes.status == "success") {
                localStorage.setItem(
                  "okto_session",
                  JSON.stringify(oktoRes.sessionConfig)
                );
              } else {
                throw new Error(`Authentication failed: ${oktoRes}`);
              }
            } else if (mode === "sdk") {
              console.log("sdk mode not supported");
            }
            navigate("/home");
          } catch (error) {
            console.error("Okto authentication failed:", error);
            navigate("/");
          }
        })
        .catch((err) => console.error(err));
    }
  }, [location, navigate, configContext, oktoClient]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-100 to-violet-200 py-12 px-4 sm:px-6 lg:px-8">
      Processing Apple login...
    </div>
  );
}
