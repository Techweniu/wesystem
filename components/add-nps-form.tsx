"use client"

import { useState, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addNpsResponse } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRole } from "@/app/dashboard/layout"

// Mapeamento seguro: ID técnico vs Rótulo de exibição
const npsCategories = [
  { id: "conteudos_roteiros", label: "Conteúdos e Roteiros" },
  { id: "audiovisual", label: "Audiovisual" },
  { id: "edicao_videos", label: "Edição de Vídeos" },
  { id: "design", label: "Design" },
  { id: "atendimento_assessor", label: "Atendimento Assessor" },
  { id: "atendimento_videomaker", label: "Atendimento VideoMaker" },
  { id: "comunicacao_presenca", label: "Comunicação e Presença" },
  { id: "resultado_parceria", label: "Resultado da Parceria" },
]

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar Avaliação"}</Button>;
}

export function AddNpsForm({ clientId }: { clientId: string }) {
  const userRole = useRole();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  if (userRole === "limited") return null;

  async function handleFormSubmit(formData: FormData) {
    formData.append('clientId', clientId);
    const result = await addNpsResponse(formData);

    if (result.error) {
      toast.error("Erro ao salvar NPS.", { description: result.error });
    } else {
      toast.success(result.success);
      setOpen(false);
      formRef.current?.reset();
      router.refresh(); 
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Adicionar NPS</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Avaliação NPS</DialogTitle>
          <DialogDescription>Preencha as notas de 0 a 10 para cada categoria.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid gap-4">
              {npsCategories.map((category) => (
                <div key={category.id} className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor={category.id} className="col-span-2">{category.label}*</Label>
                  <Input 
                    id={category.id} 
                    name={category.id} // Usa o ID seguro (sem acentos)
                    type="number" 
                    min="0" 
                    max="10" 
                    required 
                    className="col-span-1" 
                  />
                </div>
              ))}
              <div className="grid gap-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea id="observations" name="observations" placeholder="Comentários, elogios, críticas..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
