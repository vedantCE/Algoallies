import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendCitizenMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

const suggestions = ["Tips for today's weather", "How much water should I drink?", "When should I see a doctor?"];

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I'm your AI health assistant. How can I help you today?", isUser: false },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(2);

  // Keep the latest message in view
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  // Focus the input on open; Escape closes and returns focus to the launcher
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const pushMessage = (text: string, isUser: boolean) =>
    setMessages((prev) => [...prev, { id: nextId.current++, text, isUser }]);

  const handleSend = async (preset?: string) => {
    const userInput = (preset ?? input).trim();
    if (!userInput || isSending) return;

    pushMessage(userInput, true);
    setInput("");
    setIsSending(true);

    try {
      const response = await sendCitizenMessage(userInput);
      let aiText = "Sorry, I'm having trouble right now. Please try again.";

      if (response.data) {
        if (response.data.success && response.data.response) {
          aiText = response.data.response;
        } else if (response.data.message) {
          aiText = response.data.message;
        } else if (response.data.error) {
          aiText = `Error: ${response.data.error}`;
        }
      }
      pushMessage(aiText, false);
    } catch (error: any) {
      console.error("FloatingChatbot: Error caught:", error);
      let errorText = "I'm having connection issues. Please try again later.";
      if (error.response?.data?.error) {
        errorText = `Error: ${error.response.data.error}`;
      } else if (error.response?.data?.message) {
        errorText = error.response.data.message;
      }
      pushMessage(errorText, false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={launcherRef}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open AI health assistant chat"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full healthcare-gradient text-primary-foreground shadow-lg transition-shadow duration-200 hover:shadow-xl sm:bottom-6 sm:right-6"
          >
            <MessageSquare size={24} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="AI health assistant"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed inset-x-3 bottom-3 z-50 flex h-[min(560px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 healthcare-gradient p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Bot className="text-primary-foreground" size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-primary-foreground">Health Assistant</h2>
                  <p className="text-xs text-primary-foreground/85">AI-powered · Not a substitute for a doctor</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="h-11 w-11 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
              role="log"
              aria-live="polite"
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex", message.isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      message.isUser
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-muted text-foreground"
                    )}
                  >
                    <span className="sr-only">{message.isUser ? "You said:" : "Assistant said:"}</span>
                    {message.text.split("\n").map((line, i) => (
                      <p
                        key={i}
                        className={
                          line.startsWith("##")
                            ? "mb-1 mt-3 font-semibold first:mt-0"
                            : line.startsWith("•") || line.startsWith("-")
                              ? "ml-2"
                              : ""
                        }
                      >
                        {line.replace(/^##\s*/, "").replace(/^\*\*(.+?)\*\*/, "$1")}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}

              {isSending && (
                <div className="flex justify-start" aria-label="Assistant is typing">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {messages.length === 1 && !isSending && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="min-h-[36px] rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              className="flex gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <label htmlFor="chat-input" className="sr-only">
                Your health question
              </label>
              <Input
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a health question…"
                autoComplete="off"
                className="h-11 flex-1 text-base sm:text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="h-11 w-11 shrink-0"
              >
                <Send aria-hidden="true" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
