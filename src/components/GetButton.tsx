import { useOkto } from "@okto_web3/react-sdk";
import React, { useContext, useState, useEffect } from "react";
import CopyButton from "./CopyButton";
import { ConfigContext } from "../context/ConfigContext";

interface GetButtonProps {
  title: string;
  apiFn: any;
  tag: string;
}

const GetButton: React.FC<GetButtonProps> = ({ title, apiFn, tag }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [resultData, setResultData] = useState("");
  const [mode, setMode] = useState<string>("sdk");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const oktoClient = useOkto();
  const { config } = useContext(ConfigContext);

  useEffect(() => {
    setMode(config.mode);
    setBaseUrl(config.apiUrl);
  }, [config]);

  const handleButtonClick = async () => {
    try {
      let result;
      if (mode === "api") {
        const session = localStorage.getItem("okto_session");
        const sessionConfig = JSON.parse(session || "{}");
        result = await apiFn(baseUrl, sessionConfig);
      } else if (mode === "sdk") {
        result = await apiFn(oktoClient);
      }
      const resultDataStr = JSON.stringify(result, null, 2);
      setResultData(resultDataStr !== "null" ? resultDataStr : "No result");
      setModalVisible(true);
    } catch (error: any) {
      console.error(`${title} error:`, error);
      setResultData(`error: ${error}`);
      setModalVisible(true);
    }
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
            <div className="text-left text-white max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-words bg-gray-900 p-4 rounded">
                <CopyButton text={resultData} />
                {resultData}
              </pre>
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

export default GetButton;
