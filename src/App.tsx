// File: src/App.tsx
import React from "react";
import BabylonWorld from "./world/BabylonWorld";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      <BabylonWorld />
    </div>
  );
}

export default App;
