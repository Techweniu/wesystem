import { createClient } from "@/lib/supabase/server";
// ****** VERIFIQUE ESTA LINHA ******
import { AccessesClientPage } from "./accesses-client-page";
// **********************************


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

// Função de busca de dados no servidor
async function getAccessData() {
  const supabase = await createClient(); // createClient de /lib/supabase/server

  console.log("AccessesPage (Server): Tentando buscar dados...");

  const { data, error } = await supabase
    .from("platform_access")
    .select("*")
    .order("department", { nullsfirst: true })
    .order("platform_name", { ascending: true });

  if (error) {
    console.error("AccessesPage (Server): Erro ao buscar dados de acesso:", error);
    return [];
  }

  console.log(`AccessesPage (Server): Dados buscados com sucesso (${data?.length || 0} itens).`);
  return (data as PlatformAccess[]) || []; // Garante que retorna um array
}

// O Server Component principal
export default async function AccessesPage() {
  // Busca os dados no servidor ANTES de renderizar
  const initialAccesses = await getAccessData();

  // Renderiza o Client Component, passando os dados buscados como props
  return <AccessesClientPage initialAccesses={initialAccesses} />;
}
