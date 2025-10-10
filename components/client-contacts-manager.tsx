"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash2, User, Cake, Mail, Phone } from "lucide-react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { addClientContact, updateClientContact, deleteClientContact } from "@/app/dashboard/clients/[id]/actions"
import { format, parseISO } from 'date-fns'

interface Contact {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
}

interface ClientContactsManagerProps {
  clientId: string;
  contacts: Contact[];
}

const SubmitButton = ({ label }: { label: string }) => {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : label}</Button>
}

// Formulário para Adicionar ou Editar um Contato (sem alterações aqui)
const ContactForm = ({ clientId, contact, onFormSubmit }: { clientId: string, contact?: Contact, onFormSubmit: () => void }) => {
  const action = contact ? updateClientContact : addClientContact;

  return (
    <form action={async (formData) => {
        const result = await action(formData);
        if (result.error) toast.error("Erro", { description: result.error });
        else toast.success(result.success);
        onFormSubmit();
    }}>
      <input type="hidden" name="clientId" value={clientId} />
      {contact && <input type="hidden" name="contactId" value={contact.id} />}
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome*</Label>
          <Input id="name" name="name" defaultValue={contact?.name || ''} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Cargo</Label>
          <Input id="role" name="role" defaultValue={contact?.role || ''} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={contact?.email || ''} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={contact?.phone || ''} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="birth_date">Aniversário</Label>
          <Input id="birth_date" name="birth_date" type="date" defaultValue={contact?.birth_date ? format(parseISO(contact.birth_date), 'yyyy-MM-dd') : ''} />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
        <SubmitButton label={contact ? "Salvar Alterações" : "Adicionar Contato"} />
      </DialogFooter>
    </form>
  )
}

export function ClientContactsManager({ clientId, contacts }: ClientContactsManagerProps) {
    const [openDialog, setOpenDialog] = useState<string | null>(null);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Contatos dos Responsáveis</CardTitle>
                 <Dialog open={openDialog === 'new'} onOpenChange={(isOpen) => setOpenDialog(isOpen ? 'new' : null)}>
                    <DialogTrigger asChild>
                        <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Contato</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Contato</DialogTitle>
                            <DialogDescription>Insira os dados do novo responsável.</DialogDescription>
                        </DialogHeader>
                        <ContactForm clientId={clientId} onFormSubmit={() => setOpenDialog(null)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4"> {/* Aumentado o espaçamento */}
                    {contacts.map(contact => (
                        <li key={contact.id} className="flex items-start justify-between rounded-md border p-3">
                            {/* --- CONTEÚDO ALTERADO AQUI --- */}
                            <div className="flex flex-col text-sm space-y-1.5">
                                <div>
                                    <span className="font-semibold">{contact.name}</span>
                                    <p className="text-xs text-muted-foreground">{contact.role || 'Cargo não informado'}</p>
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    {contact.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3" />
                                            <span>{contact.phone}</span>
                                        </div>
                                    )}
                                    {contact.birth_date && (
                                        <div className="flex items-center gap-2">
                                            <Cake className="h-3 w-3" /> 
                                            <span>{format(parseISO(contact.birth_date), 'dd/MM/yyyy')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* --- FIM DA ALTERAÇÃO --- */}
                            <div className="flex items-center gap-1">
                                <Dialog open={openDialog === contact.id} onOpenChange={(isOpen) => setOpenDialog(isOpen ? contact.id : null)}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Editar Contato</DialogTitle>
                                            <DialogDescription>Atualize os dados de {contact.name}.</DialogDescription>
                                        </DialogHeader>
                                        <ContactForm clientId={clientId} contact={contact} onFormSubmit={() => setOpenDialog(null)} />
                                    </DialogContent>
                                </Dialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                            <AlertDialogDescription>Tem certeza que deseja remover o contato {contact.name}?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <form action={async (formData) => {
                                                const result = await deleteClientContact(formData);
                                                if (result.error) toast.error("Erro", { description: result.error });
                                                else toast.success(result.success);
                                            }}>
                                                <input type="hidden" name="contactId" value={contact.id} />
                                                <input type="hidden" name="clientId" value={clientId} />
                                                <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90">Sim, remover</AlertDialogAction>
                                            </form>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                    {contacts.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato responsável cadastrado.</p>
                    )}
                </ul>
            </CardContent>
        </Card>
    )
}
