"use client"

import { useState, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { addEmployeeObservation } from "@/app/dashboard/team/actions"
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Observation {
  id: string;
  observation: string;
  tag: 'positive' | 'negative';
  created_at: string;
}

interface EmployeeObservationsDialogProps {
  employeeId: string;
  observations: Observation[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar Observação"}</Button>
}

export function EmployeeObservationsDialog({ employeeId, observations }: EmployeeObservationsDialogProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleFormSubmit(formData: FormData) {
    formData.append('employeeId', employeeId);
    const result = await addEmployeeObservation(formData);
    if (result.error) {
      toast.error("Erro ao salvar", { description: result.error });
    } else {
      toast.success(result.success);
      formRef.current?.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Observações do Colaborador</DialogTitle>
          <DialogDescription>Adicione um novo feedback e veja o histórico.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="observation">Nova Observação</Label>
            <Textarea id="observation" name="observation" required placeholder="Escreva seu feedback aqui..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tag">Tag</Label>
            <Select name="tag" required defaultValue="positive">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positiva</SelectItem>
                <SelectItem value="negative">Negativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>

        <div className="mt-6">
          <h4 className="font-semibold mb-2">Histórico</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto rounded-lg border bg-muted/20 p-2">
            {observations.length > 0 ? (
              observations.map(obs => (
                <div key={obs.id} className="text-sm bg-background p-3 rounded-md shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(obs.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {obs.tag === 'positive' ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-green-500">
                        <ThumbsUp className="h-4 w-4" />
                        <span>Positiva</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                        <ThumbsDown className="h-4 w-4" />
                        <span>Negativa</span>
                      </div>
                    )}
                  </div>
                  {/* --- CORREÇÃO FINAL APLICADA AQUI --- */}
                  <p className="text-muted-foreground break-all">
                    {obs.observation}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma observação registrada.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
