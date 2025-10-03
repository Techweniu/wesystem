"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Define a nova estrutura de dados, mais simples
export interface NpsSummaryData {
  detractors: number;
  passives: number;
  promoters: number;
}

interface NpsScoreSummaryTableProps {
  data: NpsSummaryData;
}

export function NpsScoreSummaryTable({ data }: NpsScoreSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo de NPS por Faixa</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Classificação</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Detratores (0-6)</TableCell>
              <TableCell className="text-right">
                <Badge variant="destructive">{data.detractors}</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Neutros (7-8)</TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{data.passives}</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Promotores (9-10)</TableCell>
              <TableCell className="text-right">
                <Badge>{data.promoters}</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
