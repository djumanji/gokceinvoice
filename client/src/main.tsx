import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// import "./lib/mixpanel"; // Initialize Mixpanel - temporarily disabled due to ad-blocker issues

createRoot(document.getElementById("root")!).render(<App />);
