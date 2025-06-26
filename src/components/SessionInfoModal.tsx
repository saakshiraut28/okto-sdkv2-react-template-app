import { useOkto } from "@okto_web3/react-sdk";
import React, { useContext, useState } from "react";
import CopyButton from "./CopyButton";
import { ConfigContext } from "../context/ConfigContext";

interface SessionInfoModalProps {
  title: string;
  apiFn: any;
  tag: string;
}

const SessionInfoModal: React.FC<SessionInfoModalProps> = ({
  title,
  apiFn,
  tag,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionInfo, setSessionInfo] = useState("");
  const [oktoAuthToken, setOktoAuthToken] = useState("");
  const { authMethod } = useContext(ConfigContext);

  const handleButtonClick = () => {
    apiFn()
      .then((result: any) => {
        console.log(`${title}:`, result);
        const sessionData = JSON.stringify(result.sessionInfo, null, 2);
        const token = JSON.stringify(result.oktoAuthToken, null, 2);
        setSessionInfo(sessionData !== "null" ? sessionData : "No result"); // Pretty print the JSON
        setOktoAuthToken(token !== "null" ? token : "No result"); // Pretty print the JSON
        setModalVisible(true);
      })
      .catch((error: any) => {
        console.error(`${title} error:`, error);
        setSessionInfo(`error: ${error}`); // Pretty print the JSON
        setOktoAuthToken(`error: ${error}`); // Pretty print the JSON
        setModalVisible(true);
      });
  };

  const handleClose = () => setModalVisible(false);

  return (
    <div className="text-center">
      <button
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={handleButtonClick}
      >
        {title}
      </button>

      {modalVisible && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-black rounded-lg w-11/12 max-w-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
              <div className="flex-1 text-left">
                <h2 className="text-lg font-semibold text-white">
                  {title} Result
                </h2>
                <p className="text-sm font-regular text-white">{tag}</p>
              </div>
              <button
                className="text-gray-400 hover:text-gray-200 transition-colors text-2xl"
                onClick={handleClose}
              >
                &times;
              </button>
            </div>
            <div className="text-left text-white max-h-96 overflow-y-auto space-y-4">
              <div>
                <h3 className="text-md font-semibold mb-2">
                  Session Information:
                </h3>
                {authMethod == "webview" ? (
                  <pre className="whitespace-pre-wrap break-words bg-gray-900 p-4 rounded">
                    Session Information cannot be captured when logging in with
                    Okto Onboarding Modal
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap break-words bg-gray-900 p-4 rounded">
                    <CopyButton text={sessionInfo} />
                    {sessionInfo}
                  </pre>
                )}
              </div>
              {authMethod == "webview" ? null : (
                <div>
                  <h3 className="text-md font-semibold mb-2">
                    Okto Auth Token:
                  </h3>
                  <pre className="whitespace-pre-wrap break-words bg-gray-900 p-4 rounded">
                    <CopyButton text={oktoAuthToken} />
                    {oktoAuthToken}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-4 text-right">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionInfoModal;
