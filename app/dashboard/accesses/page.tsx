import { createClient } from "@/lib/supabase/server";
import { AccessesClientPage } from "./accesses-client-page";

// Tipagem movida para cá para ser exportada e usada no Client Component
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

// Função de busca de dados no servidor (agora busca TUDO)
async function getAccessData() {
  const supabase = await createClient(); 

  const { data, error } = await supabase
    .from("platform_access")
    .select("*")
    .order("department", { nullsfirst: true })
    .order("platform_name", { ascending: true });

  if (error) {
    console.error("AccessesPage (Server): Erro ao buscar dados de acesso:", error);
    return [];
  }

  return (data as PlatformAccess[]) || []; // Garante que retorna um array
}

// O Server Component principal
export default async function AccessesPage() {
  const initialAccesses = await getAccessData();

  // Renderiza o Client Component, passando os dados
  // O Client Component obterá a role do Contexto
  return <AccessesClientPage initialAccesses={initialAccesses} />;
}
