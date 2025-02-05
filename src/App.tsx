
import "./App.css";
import { AuthData, useOkto } from "@okto_web3/react-sdk";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import TransferNFT from "./pages/TransferNFT";
import CreateNft from "./pages/CreateNft";
import RawTransaction from "./pages/RawTransaction";
import Homepage from "./Homepage";
import TransferTokens from "./pages/TransferTokens";

function App() {
  const oktoClient = useOkto();

  //check if user is already logged in 
  const user = oktoClient.user;
  console.log(oktoClient);

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage/>} />
        <Route path="/home" element={<Homepage />} />

        <Route path="/transfertoken" element={<TransferTokens />} />
        <Route path="/transfernft" element={<TransferNFT />} />
        <Route path="/createnftcollection" element={<CreateNft />} />
        <Route path="/rawtransaction" element={<RawTransaction />} />
      </Routes>
    </>
  );
}

export default App;
