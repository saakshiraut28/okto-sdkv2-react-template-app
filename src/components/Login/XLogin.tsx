import { TwitterLoginButton } from "react-social-login-buttons";
import { useOkto } from "@okto_web3/react-sdk";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useContext, useEffect, useState } from "react";
import { ConfigContext } from "../../context/ConfigContext";
import * as authClient from "../../api/auth";
import type { Hex } from "viem";
import axios from "axios";

const REDIRECT_URI =
  "https://public-okto-react-sdk-template.vercel.app/auth/callback/twitter";

export default function XLogin() {
  const onLogoutSuccess = useCallback(() => {
    setProfile(null);
    setProvider("");
    alert("logout success");
  }, []);

  const oktoClient = useOkto();
  const navigate = useNavigate();
  const configContext = useContext(ConfigContext);

  const [mode, setMode] = useState<string>("sdk");
  const [clientPK, setClientPK] = useState<Hex>("0x");
  const [clientSWA, setClientSWA] = useState<Hex>("0x");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [provider, setProvider] = useState("");
  const [profile, setProfile] = useState<any>();

  function getTwitterOauthUrl() {
    const SCOPES = [
      "tweet.read",
      "users.read", // Needed for basic user profile information
      "users.email", // Needed for email address
      "offline.access", // Needed for refresh tokens
    ];

    const AUTH_URL = "https://x.com/i/oauth2/authorize";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: "STFrTFRTcDlmSXNGZ05VRmJwUFE6MTpjaQ",
      redirect_uri: REDIRECT_URI!,
      scope: SCOPES.join(" "),
      state: "state_" + Math.random().toString(36).substring(2),
      code_challenge: "challenge",
      code_challenge_method: "plain",
    });
    const url = `${AUTH_URL}?${params.toString()}`;
    return url;
  }

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
            Sign in with your X account
          </p>
          <a href={getTwitterOauthUrl()}>
            <TwitterLoginButton />
          </a>
        </>
      ) : null}
    </div>
  );
}

export function XAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const configContext = useContext(ConfigContext);
  const oktoClient = useOkto();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    console.log(code, state);
    if (code) {
      const mode = configContext.config.mode;
      if (mode === "sdk") {
        alert("Login is currently not supported in sdk mode");
        navigate("/");
        return;
      }
      axios
        .post(
          "https://public-okto-express-template.up.railway.app/api/auth/callback/twitter",
          {
            code,
            state,
          }
        )
        .then(async (res) => {
          const { access_token } = res.data.data;

          // Okto login logic (API mode and SDK mode)
          const mode = configContext.config.mode;
          const baseUrl = configContext.config.apiUrl;
          const clientPK = configContext.config.clientPrivateKey;
          const clientSWA = configContext.config.clientSWA;

          try {
            if (mode === "api") {
              const provider = "twitter";
              const oktoRes = await authClient.authenticate(
                baseUrl,
                access_token,
                provider,
                clientPK,
                clientSWA
              );
              console.log("oktoRes", oktoRes);
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
      Processing login...
    </div>
  );
}
