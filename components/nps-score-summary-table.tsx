"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export interface NpsSummaryData {
  detractors: number;
  passives: number;
  promoters: number;
}

// O tipo para os clientes ranqueados
interface RankedClient {
    id: string;
    name: string;
    latestNps?: number;
}

interface NpsScoreSummaryTableProps {
  data: NpsSummaryData;
  rankedClients: RankedClient[]; // Nova prop
}

export function NpsScoreSummaryTable({ data, rankedClients }: NpsScoreSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo de NPS por Faixa</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabela de Resumo (sem alterações funcionais) */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Classificação</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Detratores (0-7)</TableCell>
              <TableCell className="text-right"><Badge variant="destructive">{data.detractors}</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Neutros (8)</TableCell>
              <TableCell className="text-right"><Badge variant="secondary">{data.passives}</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Promotores (9-10)</TableCell>
              <TableCell className="text-right"><Badge>{data.promoters}</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Separator className="my-4" />

        {/* --- NOVA LISTA RANQUEADA ADICIONADA AQUI --- */}
        <div>
            <h4 className="mb-2 text-sm font-medium">Clientes que Precisam de Atenção</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Último NPS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rankedClients.length > 0 ? (
                        rankedClients.slice(0, 3).map(client => ( // Mostra os 3 piores
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">{client.name}</Link>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={client.latestNps! <= 7 ? 'destructive' : client.latestNps === 8 ? 'secondary' : 'default'}>{client.latestNps}</Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">Nenhuma avaliação encontrada.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  )
}
