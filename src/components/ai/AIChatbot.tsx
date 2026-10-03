"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useAIChat } from "@/context/AIChatContext";
import { cn } from "@/lib/format";

const suggestions = [
  "Which board is suitable for my kitchen?",
  "Show me boards for wardrobes.",
  "I need a wood finish for my bedroom.",
  "Help me choose a board under ₹50,000.",
  "What thickness should I choose?",
  "What accessories do I need?",
];

function buildCustomizeHref(prefill: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(prefill).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return `/customize?${params.toString()}`;
}

export function AIChatbot() {
  const { isOpen, messages, openChat, closeChat, sendUserMessage } = useAIChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendUserMessage(input);
    setInput("");
  };

  return (
    <>
      <button
        type="button"
        onClick={openChat}
        className={cn(
          "fixed bottom-[calc(var(--mobile-nav-h)+1rem)] right-4 z-40 flex items-center gap-2 rounded-full bg-[var(--obx-green)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-lg)] transition hover:bg-[var(--obx-green-dark)] md:bottom-8 md:right-8",
          isOpen && "pointer-events-none opacity-0",
        )}
      >
        <MessageCircle size={18} />
        <span className="hidden sm:inline">Ask OBASIX AI</span>
        <span className="sm:hidden">AI</span>
        <Sparkles size={14} className="text-[var(--obx-orange)]" />
      </button>

      <div
        className={cn(
          "fixed bottom-[calc(var(--mobile-nav-h)+0.75rem)] right-3 z-50 flex w-[min(100vw-1.5rem,400px)] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white shadow-[var(--shadow-lg)] transition-all duration-300 md:bottom-8 md:right-8",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        style={{ height: "min(70vh, 620px)" }}
      >
        <div className="flex items-center justify-between bg-[var(--obx-green)] px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <Sparkles size={16} className="text-[var(--obx-orange)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Ask OBASIX AI</p>
              <p className="text-[11px] text-white/70">Product discovery assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="rounded-full p-1.5 transition hover:bg-white/10"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--obx-mist)] p-4 scrollbar-thin">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[90%] rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-auto bg-[var(--obx-green)] text-white"
                  : "bg-white text-[var(--obx-ink)] shadow-[var(--shadow-sm)]",
              )}
            >
              <p className="whitespace-pre-line">{message.content}</p>

              {message.recommendation && (
                <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--obx-line)] bg-[var(--obx-cream)] p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--obx-green)]">
                    AI recommendation
                  </p>
                  <p className="mt-1 font-semibold">{message.recommendation.productName}</p>
                  <dl className="mt-2 space-y-1 text-xs text-[var(--obx-muted)]">
                    <div className="flex justify-between gap-3">
                      <dt>Finish</dt>
                      <dd className="font-medium text-[var(--obx-ink)]">
                        {message.recommendation.finish}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Thickness</dt>
                      <dd className="font-medium text-[var(--obx-ink)]">
                        {message.recommendation.thickness}mm
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Application</dt>
                      <dd className="font-medium capitalize text-[var(--obx-ink)]">
                        {message.recommendation.application}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Estimated price</dt>
                      <dd className="font-medium text-[var(--obx-ink)]">
                        {message.recommendation.estimatedPriceLabel}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={buildCustomizeHref(message.recommendation.customizerPrefill)}
                      className="btn btn-primary !px-3 !py-2 text-xs"
                      onClick={closeChat}
                    >
                      Customize
                    </Link>
                    <Link
                      href={`/products/${message.recommendation.productId}`}
                      className="btn btn-ghost !px-3 !py-2 text-xs"
                      onClick={closeChat}
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {messages.length <= 2 && (
          <div className="flex gap-2 overflow-x-auto border-t border-[var(--obx-line)] bg-white px-3 py-2.5 scrollbar-thin">
            {suggestions.slice(0, 4).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendUserMessage(q)}
                className="shrink-0 rounded-full border border-[var(--obx-line)] bg-[var(--obx-mist)] px-3 py-1.5 text-left text-[11px] font-medium text-[var(--obx-charcoal)] transition hover:border-[var(--obx-green)] hover:text-[var(--obx-green)]"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-[var(--obx-line)] bg-white p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about boards, finishes, spaces..."
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--obx-line)] bg-[var(--obx-mist)] px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)] focus:bg-white"
          />
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--obx-red)] text-white transition hover:bg-[var(--obx-red-dark)]"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </form>

        <div className="flex items-center justify-between bg-[var(--obx-green-soft)] px-3 py-2 text-[10px] text-[var(--obx-muted)]">
          <span>Ready for OBASIX AI API connection</span>
          <Link href="/customize" onClick={closeChat} className="inline-flex items-center gap-1 font-semibold text-[var(--obx-green)]">
            Open customizer <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </>
  );
}
