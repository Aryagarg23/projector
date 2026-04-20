import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AnswerScreen } from "./app/components/AnswerScreen.tsx";
import { ResultsScreen } from "./app/components/ResultsScreen.tsx";
import { AdminPanel } from "./app/components/AdminPanel.tsx";
import "./styles/index.css";

function pickRoute() {
  const path = window.location.pathname.replace(/\/+$/, "");
  switch (path) {
    case "/answer-here":
      return <AnswerScreen />;
    case "/results-here":
      return <ResultsScreen />;
    case "/admin":
      return <AdminPanel />;
    default:
      return <App />;
  }
}

createRoot(document.getElementById("root")!).render(pickRoute());
