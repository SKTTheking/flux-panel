
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";

const copyTextWithTextarea = (text: string): Promise<void> => {
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  return copied
    ? Promise.resolve()
    : Promise.reject(new Error("Fallback clipboard copy failed"));
};

const installClipboardFallback = () => {
  const nativeClipboard = navigator.clipboard;
  const nativeWriteText = nativeClipboard?.writeText?.bind(nativeClipboard);

  const writeText = async (text: string) => {
    if (nativeWriteText && window.isSecureContext) {
      try {
        await nativeWriteText(text);
        return;
      } catch {
        // Use the textarea fallback when browser permission blocks Clipboard API.
      }
    }

    await copyTextWithTextarea(text);
  };

  try {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        ...nativeClipboard,
        writeText,
      },
    });
  } catch {
    if (nativeClipboard) {
      nativeClipboard.writeText = writeText;
    }
  }
};

installClipboardFallback();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>
);
