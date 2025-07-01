import { GoogleLogin } from "@react-oauth/google";
import { useOkto } from "@okto_web3/react-sdk";
import { useNavigate } from "react-router-dom";

export default () => {

    const oktoClient = useOkto();
    const navigate = useNavigate();

    const handleGoogleLogin = async (credentialResponse: any) => {
    const idToken = credentialResponse.credential || "";
    if (idToken) {
      localStorage.setItem("googleIdToken", idToken);
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
    }
  };

    return (
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
    );
}