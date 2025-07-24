import React, { useContext, useState } from "react";
import packageJson from "../../package.json";
import { FileCheck2, Github } from "lucide-react";
import { ConfigContext } from "../context/ConfigContext";

const Navbar = () => {
  const { config } = useContext(ConfigContext);
  const mode = config.mode;
  return (
    <nav className="bg-gray-700 text-white p-4 shadow-md">
      <div className="flex justify-between items-center gap-8 mx-4">
        <div className="text-xl font-bold">
          <img src="/icon.svg" className="w-10 h-10" />
        </div>
        <div className="font-semibold flex flex-col items-center text-center gap-1">
          <div className="text-lg">Okto API/SDK Demo and Debugging Tool</div>
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-gray-600 text-gray-200 rounded-full border border-gray-500">
              v{packageJson.dependencies["@okto_web3/react-sdk"]}
            </span>
            {mode && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-600 text-gray-200 rounded-full border border-gray-500">
                {mode.toUpperCase()} Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            className="underline hover:text-indigo-400"
            href="https://github.com/okto-hq/okto-sdkv2-react-template-app"
            target="_blank"
            title="Link to Github Repository"
          >
            <Github className="w-10 h-10 p-2 rounded-full bg-gray-800 hover:bg-gray-300" />
          </a>
          <a
            className="underline hover:text-indigo-400"
            href="https://docsv2.okto.tech/docs"
            target="_blank"
            title="Link to Okto Trade Service Docs"
          >
            <FileCheck2 className="w-10 h-10 p-2 rounded-full bg-gray-800 hover:bg-gray-300" />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
