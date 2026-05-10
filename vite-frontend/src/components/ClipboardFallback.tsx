import { useEffect } from "react";

const fallbackCopy = (text: string): boolean => {
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let ok = false;

  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }

  document.body.removeChild(textarea);

  return ok;
};

export default function ClipboardFallback() {
  useEffect(() => {
    const originalClipboard = navigator.clipboard;
    const originalWriteText = originalClipboard?.writeText?.bind(originalClipboard);

    const writeText = async (text: string) => {
      if (originalWriteText && window.isSecureContext) {
        try {
          await originalWriteText(text);
          return;
        } catch {
          // fallback below
        }
      }

      if (fallbackCopy(text)) {
        return;
      }

      throw new Error("复制失败，请手动选择文本复制");
    };

    try {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          ...(originalClipboard || {}),
          writeText,
        },
      });
    } catch {
      // Some browsers may not allow redefining navigator.clipboard.
    }
  }, []);

  return null;
}
