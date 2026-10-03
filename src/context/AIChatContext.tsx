"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ApplicationType, CustomizerState } from "@/lib/types";

export interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  recommendation?: {
    productId: string;
    productName: string;
    finish: string;
    colour: string;
    thickness: number;
    application: ApplicationType;
    estimatedPriceLabel: string;
    customizerPrefill: Partial<CustomizerState>;
  };
}

interface AIChatContextValue {
  isOpen: boolean;
  messages: ChatMessage[];
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendUserMessage: (content: string) => void;
  applySuggestion: (question: string) => void;
}

const ChatContext = createContext<AIChatContextValue | null>(null);

const greeting: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi! I'm OBASIX AI 👋\nI can help you find the right board, compare products, customize your selection and plan your space.",
};

/** Placeholder responses — wired for a future AI API, not final product answers. */
function buildPlaceholderReply(userText: string): ChatMessage {
  const lower = userText.toLowerCase();

  if (lower.includes("kitchen")) {
    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      content:
        "For kitchens, moisture-resistant boards with matte or laminate finishes are a strong starting point. Here's a guided recommendation you can refine in the customizer — connect a live AI API later for catalogue-aware answers.",
      recommendation: {
        productId: "obx-aqua-shield",
        productName: "OBASIX Aqua Shield",
        finish: "Matte",
        colour: "Ivory",
        thickness: 18,
        application: "kitchen",
        estimatedPriceLabel: "₹XX,XXX",
        customizerPrefill: {
          productId: "obx-aqua-shield",
          finishId: "matte",
          colourId: "ivory",
          thickness: 18,
          application: "kitchen",
          quantity: 6,
        },
      },
    };
  }

  if (lower.includes("wardrobe")) {
    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      content:
        "Wardrobes pair well with smooth engineered boards and warm wood finishes. Preview this starting configuration, then customize sizes and quantity.",
      recommendation: {
        productId: "obx-woodline",
        productName: "OBASIX Woodline",
        finish: "Wood Finish",
        colour: "Light Oak",
        thickness: 18,
        application: "wardrobe",
        estimatedPriceLabel: "₹XX,XXX",
        customizerPrefill: {
          productId: "obx-woodline",
          finishId: "wood-finish",
          colourId: "light-oak",
          thickness: 18,
          application: "wardrobe",
          quantity: 8,
        },
      },
    };
  }

  if (lower.includes("bedroom") || lower.includes("wood")) {
    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      content:
        "A light wood finish works beautifully in bedrooms. Here's a pre-filled path into the customizer — final pricing and availability will come from your live product API.",
      recommendation: {
        productId: "obx-premium-board",
        productName: "OBASIX Premium Board",
        finish: "Light Oak",
        colour: "Light Oak",
        thickness: 18,
        application: "bedroom",
        estimatedPriceLabel: "₹XX,XXX",
        customizerPrefill: {
          productId: "obx-premium-board",
          finishId: "wood-finish",
          colourId: "light-oak",
          thickness: 18,
          application: "bedroom",
          quantity: 6,
        },
      },
    };
  }

  if (lower.includes("thickness")) {
    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      content:
        "Thickness depends on use: 12–16mm for panels and backs, 18mm for most shutters and carcasses, 25mm for shelves and heavy-duty surfaces. Share your application and I can guide a starting board — this UI is ready for a real AI backend.",
    };
  }

  if (lower.includes("50,000") || lower.includes("50000") || lower.includes("under")) {
    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      content:
        "Budget filters will connect to live catalogue pricing. For now, explore Laminate Pro and Premium Board ranges, then request a quote with your exact dimensions for an accurate estimate.",
      recommendation: {
        productId: "obx-laminate-pro",
        productName: "OBASIX Laminate Pro",
        finish: "Laminate",
        colour: "Ash Grey",
        thickness: 18,
        application: "furniture",
        estimatedPriceLabel: "₹XX,XXX",
        customizerPrefill: {
          productId: "obx-laminate-pro",
          finishId: "laminate",
          colourId: "ash-grey",
          thickness: 18,
          application: "furniture",
          quantity: 4,
        },
      },
    };
  }

  if (lower.includes("accessor")) {
    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      content:
        "Most board setups benefit from edge banding, hinges or handles, and installation hardware. Add boards to your cart to see recommended accessories for that configuration.",
    };
  }

  return {
    id: `a-${Date.now()}`,
    role: "assistant",
    content:
      "Thanks for your question. This chat UI is ready to connect to an OBASIX product, catalogue and FAQ API. Meanwhile, try a suggested prompt or browse products to customize your board.",
  };
}

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);

  const sendUserMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Placeholder only — replace with fetch('/api/ai') when backend is ready.
    window.setTimeout(() => {
      setMessages((prev) => [...prev, buildPlaceholderReply(trimmed)]);
    }, 450);
  }, []);

  const applySuggestion = useCallback(
    (question: string) => {
      setIsOpen(true);
      sendUserMessage(question);
    },
    [sendUserMessage],
  );

  const value = useMemo(
    () => ({
      isOpen,
      messages,
      openChat,
      closeChat,
      toggleChat,
      sendUserMessage,
      applySuggestion,
    }),
    [
      isOpen,
      messages,
      openChat,
      closeChat,
      toggleChat,
      sendUserMessage,
      applySuggestion,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useAIChat(): AIChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useAIChat must be used within AIChatProvider");
  }
  return ctx;
}
