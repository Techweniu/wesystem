"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface NpsScoreSummaryTableProps {
  data: Array<{
    name: string
    nps: number
  }>
}

export function NpsScoreSummaryTable({ data }: NpsScoreSummaryTableProps) {
  const counts = {
    '0-6': 0, // Detratores
    '7-8': 0, // Neutros
    '9-10': 0, // Promotores
  };

  data.forEach(client => {
    if (client.nps >= 0 && client.nps <= 6) {
      counts['0-6']++;
    } else if (client.nps >= 7 && client.nps <= 8) {
      counts['7-8']++;
    } else if (client.nps >= 9 && client.nps <= 10) {
      counts['9-10']++;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo de NPS por Faixa</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Detratores (0-6)</TableCell>
              <TableCell className="text-right">
                <Badge variant="destructive">{counts['0-6']}</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Neutros (7-8)</TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{counts['7-8']}</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Promotores (9-10)</TableCell>
              <TableCell className="text-right">
                <Badge>{counts['9-10']}</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
