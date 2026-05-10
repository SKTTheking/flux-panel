import { useEffect, useRef } from "react";

import { getForwardList } from "@/api";

type FlowSnapshot = {
  inFlow: number;
  outFlow: number;
  time: number;
};

type SpeedItem = {
  id: number;
  name: string;
  inPort?: number;
  inSpeed: number;
  outSpeed: number;
};

const formatSpeed = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "0 B/s";
  if (value < 1024) return `${value.toFixed(0)} B/s`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)} KB/s`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)} MB/s`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB/s`;
};

const removeSpeedRows = () => {
  document.querySelectorAll('[data-flux-speed-row="true"]').forEach((node) => node.remove());
};

const textOf = (el: Element | null) => el?.textContent || "";

const findForwardCard = (item: SpeedItem): HTMLElement | null => {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .filter((el) => {
      const text = textOf(el);
      const rect = el.getBoundingClientRect();

      return (
        rect.width >= 180 &&
        rect.width <= 760 &&
        rect.height >= 100 &&
        rect.height <= 560 &&
        text.includes(item.name) &&
        text.includes("入口") &&
        text.includes("目标") &&
        text.includes("编辑") &&
        text.includes("删除") &&
        (!item.inPort || text.includes(String(item.inPort)))
      );
    })
    .sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      return ar.width * ar.height - br.width * br.height;
    });

  return cards[0] || null;
};

const putSpeedIntoCard = (item: SpeedItem) => {
  const card = findForwardCard(item);

  if (!card) return;

  const row = document.createElement("div");

  row.dataset.fluxSpeedRow = "true";
  row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 12px 0 12px;font-size:12px;line-height:1.2;";
  row.innerHTML = `
    <div style="border-radius:999px;background:#dbeafe;color:#075985;padding:6px 8px;font-weight:600;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">实时↑ ${formatSpeed(item.inSpeed)}</div>
    <div style="border-radius:999px;background:#dcfce7;color:#047857;padding:6px 8px;font-weight:600;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">实时↓ ${formatSpeed(item.outSpeed)}</div>
  `;

  const actionBar = Array.from(card.querySelectorAll<HTMLElement>("div"))
    .filter((el) => {
      const text = textOf(el);
      const rect = el.getBoundingClientRect();

      return text.includes("编辑") && text.includes("诊断") && text.includes("删除") && rect.height <= 90;
    })
    .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];

  if (actionBar?.parentElement) {
    actionBar.parentElement.insertBefore(row, actionBar);
  } else {
    card.appendChild(row);
  }
};

export default function ForwardCardSpeedEmbedder() {
  const previousRef = useRef<Map<number, FlowSnapshot>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (window.location.pathname !== "/forward") {
        previousRef.current.clear();
        removeSpeedRows();
        return;
      }

      try {
        const now = Date.now();
        const res = await getForwardList();

        if (cancelled || res.code !== 0) return;

        const previous = previousRef.current;
        const next = new Map<number, FlowSnapshot>();
        const items: SpeedItem[] = (res.data || []).map((forward: any) => {
          const id = Number(forward.id);
          const inFlow = Number(forward.inFlow || 0);
          const outFlow = Number(forward.outFlow || 0);
          const old = previous.get(id);
          const seconds = old ? Math.max((now - old.time) / 1000, 1) : 0;
          const inSpeed = old ? Math.max((inFlow - old.inFlow) / seconds, 0) : 0;
          const outSpeed = old ? Math.max((outFlow - old.outFlow) / seconds, 0) : 0;

          next.set(id, { inFlow, outFlow, time: now });

          return {
            id,
            name: forward.name || `转发 ${id}`,
            inPort: Number(forward.inPort || 0),
            inSpeed,
            outSpeed,
          };
        });

        previousRef.current = next;

        window.requestAnimationFrame(() => {
          if (cancelled) return;
          removeSpeedRows();
          items.forEach(putSpeedIntoCard);
        });
      } catch (error) {
        console.warn("刷新转发实时速度失败:", error);
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      removeSpeedRows();
    };
  }, []);

  return null;
}
