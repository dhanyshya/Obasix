"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AIRecommendation, CustomizerState } from "@/lib/types";

export interface ChatLink {
  label: string;
  href: string;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  recommendations?: AIRecommendation[];
  customizerCta?: {
    label: string;
    prefill: Partial<CustomizerState>;
  };
  links?: ChatLink[];
  error?: boolean;
  retryable?: boolean;
}

interface AIChatContextValue {
  isOpen: boolean;
  isLoading: boolean;
  isConfigured: boolean | null;
  messages: ChatMessage[];
  lastFailedPrompt: string | null;
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  toggleChat: () => void;
  sendUserMessage: (content: string) => Promise<void>;
  retryLastFailed: () => Promise<void>;
  applySuggestion: (question: string) => void;
}

const ChatContext = createContext<AIChatContextValue | null>(null);

const greeting: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Hey there! 👋 Welcome to OBASIX. Looking to transform a space, explore beautiful boards, or just gathering some design inspiration?\n\nTell me a little — are you planning for a home, office, or just browsing for ideas today?",
};

type ApiSuccess = {
  ok: true;
  message: string;
  productIds?: string[];
  recommendations?: AIRecommendation[];
  customizerCta?: {
    label: string;
    prefill: Partial<CustomizerState>;
  } | null;
};

type ApiFailure = {
  ok: false;
  message?: string;
  links?: ChatLink[];
  required?: string[];
  retryable?: boolean;
  recommendations?: AIRecommendation[];
  customizerCta?: {
    label: string;
    prefill: Partial<CustomizerState>;
  } | null;
};

const FRIENDLY_ERROR =
  "I'm having trouble responding right now. You can still browse our products or explore board customization.";

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const messagesRef = useRef(messages);
  const inFlightRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const minimizeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);

  const sendUserMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || inFlightRef.current) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const history = [...messagesRef.current, userMessage]
      .filter((m) => m.id !== "greeting" && !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    inFlightRef.current = true;
    setIsLoading(true);
    setIsOpen(true);
    setLastFailedPrompt(null);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = (await response.json()) as ApiSuccess | ApiFailure;

      if (!response.ok || !data.ok) {
        const failure = data as ApiFailure;
        if (response.status === 503) setIsConfigured(false);
        setLastFailedPrompt(failure.retryable === false ? null : trimmed);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            error: true,
            retryable: failure.retryable !== false,
            content: failure.message || FRIENDLY_ERROR,
            recommendations: failure.recommendations?.filter((rec) => Boolean(rec.productId)),
            customizerCta: failure.customizerCta ?? undefined,
            links: failure.links ?? [
              { label: "Browse Products", href: "/products" },
              { label: "Find a Board", href: "/products?guide=1" },
              { label: "Customize a Board", href: "/customize" },
              { label: "Explore Accessories", href: "/products?family=stands-accessories" },
            ],
          },
        ]);
        return;
      }

      setIsConfigured(true);
      setLastFailedPrompt(null);
      const recommendations =
        data.recommendations?.filter((rec) => Boolean(rec.productId)) ??
        (data.productIds ?? []).map((productId) => ({
          productId,
          reason: "Suggested from the live OBASIX catalogue",
        }));

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.message,
          recommendations: recommendations.length ? recommendations : undefined,
          customizerCta: data.customizerCta ?? undefined,
        },
      ]);
    } catch {
      setLastFailedPrompt(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          error: true,
          retryable: true,
          content: FRIENDLY_ERROR,
          links: [
            { label: "Browse Products", href: "/products" },
            { label: "Customize a Board", href: "/customize" },
            { label: "Visualize Your Space", href: "/visualize" },
          ],
        },
      ]);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const retryLastFailed = useCallback(async () => {
    if (!lastFailedPrompt || inFlightRef.current) return;
    const prompt = lastFailedPrompt;
    setMessages((prev) => {
      const next = [...prev];
      if (next[next.length - 1]?.error) next.pop();
      if (next[next.length - 1]?.role === "user" && next[next.length - 1]?.content === prompt) {
        next.pop();
      }
      return next;
    });
    setLastFailedPrompt(null);
    await sendUserMessage(prompt);
  }, [lastFailedPrompt, sendUserMessage]);

  const applySuggestion = useCallback(
    (question: string) => {
      setIsOpen(true);
      void sendUserMessage(question);
    },
    [sendUserMessage],
  );

  const value = useMemo(
    () => ({
      isOpen,
      isLoading,
      isConfigured,
      messages,
      lastFailedPrompt,
      openChat,
      closeChat,
      minimizeChat,
      toggleChat,
      sendUserMessage,
      retryLastFailed,
      applySuggestion,
    }),
    [
      isOpen,
      isLoading,
      isConfigured,
      messages,
      lastFailedPrompt,
      openChat,
      closeChat,
      minimizeChat,
      toggleChat,
      sendUserMessage,
      retryLastFailed,
      applySuggestion,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useAIChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useAIChat must be used within AIChatProvider");
  return ctx;
}
