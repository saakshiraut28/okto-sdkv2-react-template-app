import { useNavigate } from "react-router-dom";
import { useOktoWebView } from "@okto_web3/react-sdk";

export default () => {

    const navigate = useNavigate();
    const {isModalOpen, authenticate} = useOktoWebView();

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
    );
}