"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateChatResponse } from "./actions";

// Define a estrutura de uma mensagem
type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const result = await generateChatResponse(newMessages);

    if (result.error) {
      const errorMessage: Message = { role: "assistant", content: `Erro: ${result.error}` };
      setMessages((prev) => [...prev, errorMessage]);
    } else if (result.success) {
      const assistantMessage: Message = { role: "assistant", content: result.success };
      setMessages((prev) => [...prev, assistantMessage]);
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assistente IA</h1>
        <p className="text-muted-foreground">Converse com a IA para obter insights sobre seus dados.</p>
      </div>
      <Card className="h-[75vh] flex flex-col">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="space-y-4 pr-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mb-2" />
                  <p>Comece a conversa! Pergunte-me algo sobre seus clientes ou finanças.</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === "user" ? "justify-end" : ""
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-md rounded-lg p-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                   {message.role === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                     <div className="max-w-md rounded-lg p-3 bg-muted flex items-center space-x-2">
                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-foreground rounded-full animate-bounce"></span>
                     </div>
                 </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-4 border-t">
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
