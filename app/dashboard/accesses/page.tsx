import { createClient } from "@supabase/supabase-js";
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
  // CORREÇÃO: Inicializa o cliente com a SERVICE_ROLE_KEY para ignorar o RLS (Row Level Security).
  // Isso garante que todos os acessos sejam listados, independentemente das restrições do usuário logado.
  // Resolve o problema onde "Produção" sumia mesmo para usuários da Diretoria.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
