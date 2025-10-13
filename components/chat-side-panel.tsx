"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";
import { ChatInterface } from "./chat-interface";

export function ChatSidePanel() {
  return (
    // A propriedade "modal={false}" é a mágica que permite interagir com a página enquanto o painel está aberto.
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Sparkles className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      {/* O painel em si. Definimos a largura e a altura. */}
      <SheetContent side="right" className="w-[400px] sm:w-[540px] h-[calc(100%-80px)] top-[80px] rounded-l-xl p-0">
        <ChatInterface />
      </SheetContent>
    </Sheet>
  );
}
