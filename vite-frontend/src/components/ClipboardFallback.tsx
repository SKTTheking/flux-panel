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
    // 不覆盖浏览器原生 clipboard，避免部分浏览器点击按钮后白屏。
    // 只在 HTTP 页面里 navigator.clipboard 不存在时，补一个最小可用的 writeText。
    if (navigator.clipboard?.writeText) return;

    const writeText = async (text: string) => {
      if (fallbackCopy(text)) return;
      throw new Error("复制失败，请手动选择文本复制");
    };

    try {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
    } catch {
      // 不允许补 clipboard 时保持原状，让页面自己的错误处理接管。
    }
  }, []);

  return null;
}
