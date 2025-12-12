"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trophy, Plus, Trash2, Save, Calendar, CheckSquare, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { updateCareerPlanPanel } from "@/app/dashboard/team/actions"
import { format, differenceInDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRole } from "@/app/dashboard/layout"

interface CareerGoal {
  id: string
  text: string
  checked: boolean
}

interface CareerPlanPanelProps {
  employeeId: string
  initialContent: string | null
  initialGoals: CareerGoal[] | null
  initialExpirationDate: string | null
}

export function CareerPlanPanel({
  employeeId,
  initialContent,
  initialGoals,
  initialExpirationDate,
}: CareerPlanPanelProps) {
  const userRole = useRole()
  const canEdit = userRole !== "limited"

  const [content, setContent] = useState(initialContent || "")
  const [goals, setGoals] = useState<CareerGoal[]>(initialGoals || [])
  const [expirationDate, setExpirationDate] = useState(initialExpirationDate || "")
  const [newGoalText, setNewGoalText] = useState("")
  const [isPending, startTransition] = useTransition()
  
  // Controle de edição
  const [isEditing, setIsEditing] = useState(false)

  // Calcular status do vencimento
  const daysUntilExpiration = expirationDate 
    ? differenceInDays(parseISO(expirationDate), new Date()) 
    : null

  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0
  const isNearExpiration = daysUntilExpiration !== null && daysUntilExpiration >= 0 && daysUntilExpiration <= 30

  async function handleSave() {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("employeeId", employeeId)
      formData.append("content", content)
      formData.append("goals", JSON.stringify(goals))
      formData.append("expirationDate", expirationDate)

      const result = await updateCareerPlanPanel(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.success)
        setIsEditing(false)
      }
    })
  }

  function addGoal() {
    if (!newGoalText.trim()) return
    const newGoal: CareerGoal = {
      id: crypto.randomUUID(),
      text: newGoalText,
      checked: false,
    }
    setGoals([...goals, newGoal])
    setNewGoalText("")
  }

  function removeGoal(id: string) {
    setGoals(goals.filter((g) => g.id !== id))
  }

  function toggleGoal(id: string) {
    const updatedGoals = goals.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g))
    setGoals(updatedGoals)
    // Se não estiver em modo de edição explícito, salva automaticamente o check
    if (!isEditing) {
       // Pequeno delay ou debounce idealmente, mas aqui vamos salvar direto
       // para garantir persistência do check rápido
       startTransition(async () => {
          const formData = new FormData()
          formData.append("employeeId", employeeId)
          formData.append("content", content)
          formData.append("goals", JSON.stringify(updatedGoals))
          formData.append("expirationDate", expirationDate)
          await updateCareerPlanPanel(formData)
       })
    }
  }

  return (
    <Card className={`border-2 transition-colors ${
        isExpired 
        ? "border-destructive/50 bg-destructive/5" 
        : isNearExpiration 
            ? "border-yellow-500/50 bg-yellow-500/5" 
            : "border-primary/20"
    }`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Trophy className={`h-6 w-6 ${isExpired ? "text-destructive" : "text-primary"}`} />
          <div>
            <CardTitle>Plano de Carreira e Metas</CardTitle>
            <CardDescription>Acompanhamento de desenvolvimento e objetivos.</CardDescription>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <Button onClick={handleSave} disabled={isPending} size="sm">
                <Save className="mr-2 h-4 w-4" />
                {isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                Editar Plano
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seção de Datas e Status */}
        <div className="flex flex-wrap items-center gap-4 bg-background/50 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="whitespace-nowrap">Vencimento do Plano:</Label>
            </div>
            
            {isEditing ? (
                <Input 
                    type="date" 
                    value={expirationDate} 
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-auto"
                />
            ) : (
                <div className="flex items-center gap-2">
                    <span className="font-medium">
                        {expirationDate 
                            ? format(parseISO(expirationDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) 
                            : "Não definido"}
                    </span>
                    {isExpired && (
                        <span className="flex items-center text-xs font-bold text-destructive animate-pulse">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            VENCIDO
                        </span>
                    )}
                    {isNearExpiration && (
                        <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                            Vence em {daysUntilExpiration} dias
                        </span>
                    )}
                </div>
            )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Coluna 1: Descrição Livre */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2 text-primary">
                    <CheckSquare className="h-4 w-4" />
                    Descrição e Objetivos Gerais
                </Label>
                {isEditing ? (
                    <Textarea 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        placeholder="Descreva o plano de carreira, expectativas e próximos passos..."
                        className="min-h-[250px] font-normal"
                    />
                ) : (
                    <div className="min-h-[250px] p-4 rounded-md border bg-muted/20 whitespace-pre-wrap text-sm">
                        {content || <span className="text-muted-foreground italic">Nenhum detalhe adicionado ao plano.</span>}
                    </div>
                )}
            </div>

            {/* Coluna 2: Checklist de Metas */}
            <div className="space-y-3 flex flex-col h-full">
                <Label className="flex items-center gap-2 text-primary">
                    <Trophy className="h-4 w-4" />
                    Checklist de Metas
                </Label>
                
                <div className="flex-1 rounded-md border bg-muted/20 p-4 space-y-3 min-h-[250px]">
                    {goals.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-8">Nenhuma meta definida.</p>
                    )}
                    
                    {goals.map((goal) => (
                        <div key={goal.id} className="flex items-start gap-2 group">
                            <Checkbox 
                                id={goal.id} 
                                checked={goal.checked} 
                                onCheckedChange={() => toggleGoal(goal.id)}
                                disabled={!canEdit && !isEditing} // Permite check se for admin mesmo sem estar editando
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <label 
                                    htmlFor={goal.id}
                                    className={`text-sm leading-snug cursor-pointer ${goal.checked ? "line-through text-muted-foreground" : ""}`}
                                >
                                    {goal.text}
                                </label>
                            </div>
                            {isEditing && (
                                <button 
                                    onClick={() => removeGoal(goal.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 p-1 rounded"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {isEditing && (
                    <div className="flex gap-2 pt-2">
                        <Input 
                            placeholder="Nova meta..." 
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                        />
                        <Button onClick={addGoal} size="icon" variant="secondary">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
