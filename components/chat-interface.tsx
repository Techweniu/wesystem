"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateChatResponse } from "@/app/dashboard/chat/actions";

type Message = {
  role: "user" | "assistant";
  content: string | object;
};

// FUNÇÃO SEGURA PARA RENDERIZAR A MENSAGEM DO ASSISTENTE
const renderAssistantMessage = (content: string | object) => {
  // Se for o pedido de senha, renderiza o componente específico
  if (typeof content === 'object' && content && (content as any).type === 'password_prompt') {
    return (
      <div className="flex flex-col">
        <p className="text-sm font-medium">Acesso a Dados Sensíveis</p>
        <p className="text-sm text-muted-foreground mt-1">Para acessar esta informação, por favor, digite sua pergunta novamente incluindo a palavra-passe de segurança.</p>
      </div>
    );
  }

  // Se for um objeto de texto, extrai o conteúdo
  if (typeof content === 'object' && content && (content as any).type === 'text') {
    return <p className="text-sm whitespace-pre-wrap">{(content as any).content}</p>;
  }
  
  // Se for uma string simples, renderiza diretamente
  if (typeof content === 'string') {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  }

  // Fallback "à prova de falhas": se for um objeto inesperado, converte para string
  return <p className="text-sm whitespace-pre-wrap text-red-500">Formato de resposta inesperado: {JSON.stringify(content)}</p>;
};


export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: "smooth" });
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
      const errorMessage: Message = { role: "assistant", content: { type: 'text', content: `Erro: ${result.error}` } };
      setMessages((prev) => [...prev, errorMessage]);
    } else if (result.success) {
      const assistantMessage: Message = { role: "assistant", content: result.success };
      setMessages((prev) => [...prev, assistantMessage]);
    }

    setIsLoading(false);
  };

  return (
    <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
      <CardHeader>
        <CardTitle>Assistente IA</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-2" />
                <p>Como posso ajudar hoje?</p>
              </div>
            )}
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <div key={index} className={cn("flex items-start gap-3", isUser ? "justify-end" : "")}>
                  {!isUser && (
                    <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback></Avatar>
                  )}
                  <div className={cn("rounded-lg p-3 max-w-md", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {isUser 
                      ? <p className="text-sm whitespace-pre-wrap">{message.content as string}</p> 
                      : renderAssistantMessage(message.content)
                    }
                  </div>
                  {isUser && (
                    <Avatar className="h-8 w-8"><AvatarFallback><User className="h-5 w-5" /></AvatarFallback></Avatar>
                  )}
                </div>
              );
            })}
            {isLoading && (
               <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback></Avatar>
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
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Digite sua mensagem..." disabled={isLoading} />
          <Button type="submit" disabled={isLoading || !input.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </CardFooter>
    </Card>
  );
}
