import React, { useState } from "react";
import ApiRequestOverlay from "./ApiRequestOverlay";
import ApiResponseOverlay from "./ApiResponseOverlay";
import { ConfigContext } from "../context/ConfigContext";

const ApiOverlayContainer: React.FC = () => {
  const { config } = React.useContext(ConfigContext);
  const [requestOpen, setRequestOpen] = useState(false);
  if (config.mode !== "api") return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        top: "30%",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "flex-end",
      }}
    >
      <ApiRequestOverlay open={requestOpen} setOpen={setRequestOpen} />
      <ApiResponseOverlay />
    </div>
  );
};

export default ApiOverlayContainer;
