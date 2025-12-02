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
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

const npsCategories = [
  "Conteúdos e Roteiros", "Audiovisual", "Edição de Vídeos", "Design",
  "Atendimento Assessor", "Atendimento VideoMaker", "Comunicação e Presença", "Resultado da Parceria"
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar Avaliação"}</Button>;
}

export function AddNpsForm({ clientId }: { clientId: string }) {
  const userRole = useRole(); // --- ALTERAÇÃO
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // --- ALTERAÇÃO ---
  if (userRole === "limited") return null;
  // ----------------

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
      {/* ... conteúdo do dialog (omitido, sem alterações) ... */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Avaliação NPS</DialogTitle>
          <DialogDescription>Preencha as notas de 0 a 10 para cada categoria.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid gap-4">
              {npsCategories.map((category) => (
                <div key={category} className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor={category} className="col-span-2">{category}*</Label>
                  <Input id={category} name={category} type="number" min="0" max="10" required className="col-span-1" />
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
