import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOkto } from "@okto_web3/react-sdk";

export default () => {

    const oktoClient = useOkto();
    const navigate = useNavigate();

    const [phoneNo, setPhoneNo] = useState<string>("");
    const [otp, setOtp] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [token, setToken] = useState<string>("");

    useEffect(()=>{
      setStatus("send_OTP");
    }, []);

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

    return (
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
    );
}