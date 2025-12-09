import { createAdminClient } from "@/lib/supabase/server"; // Admin Client
import { AccessesClientPage } from "./accesses-client-page";

// CONFIGURAÇÃO DE CACHE:
// Força a página a ser dinâmica e não usar cache estático.
// Isso garante que os dados exibidos sejam sempre os atuais do banco.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export type PlatformAccess = {
  id: string;
  platform_name: string;
  username: string | null;
  password_info: string | null;
  department: 'Diretoria' | 'Tecnologia' | 'Produção' | 'Marketing' | 'Cliente' | 'Geral' | null;
  notes: string | null;
  client_name: string | null;
  created_at: string;
  updated_at: string;
};

async function getAccessData() {
  const supabase = createAdminClient(); // Busca com privilégios

  const { data, error } = await supabase
    .from("platform_access")
    .select("*")
    .order("department", { nullsfirst: true })
    .order("platform_name", { ascending: true });

  if (error) {
    console.error("AccessesPage (Server): Erro ao buscar dados de acesso:", error);
    return [];
  }

  return (data as PlatformAccess[]) || []; 
}

export default async function AccessesPage() {
  const initialAccesses = await getAccessData();
  return <AccessesClientPage initialAccesses={initialAccesses} />;
}
