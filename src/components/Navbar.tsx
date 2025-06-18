import React from "react";
import packageJson from "../../package.json";

const Navbar = () => {
  return (
    <nav className="bg-gray-700 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">
          <img src="/icon.svg" className="w-10 h-10" />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold flex items-center gap-3">
          Okto React SDK Demo
          <span className="px-2 py-1 text-xs font-medium bg-gray-600 text-gray-200 rounded-full border border-gray-500">
            v{packageJson.dependencies["@okto_web3/react-sdk"]}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
