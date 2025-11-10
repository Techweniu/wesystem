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

// Função de busca de dados no servidor (agora filtra por role)
async function getAccessData(userRole: "admin" | "limited") {
  const supabase = await createClient(); 

  console.log(`AccessesPage (Server): Buscando dados para role: ${userRole}`);

  let query = supabase
    .from("platform_access")
    .select("*")
    .order("department", { nullsfirst: true })
    .order("platform_name", { ascending: true });
  
  // SE O USUÁRIO FOR 'LIMITED', NÃO MOSTRA DIRETORIA E CLIENTE
  if (userRole === 'limited') {
    query = query.not("department", "eq", "Diretoria");
    query = query.not("department", "eq", "Cliente");
  }

  const { data, error } = await query;

  if (error) {
    console.error("AccessesPage (Server): Erro ao buscar dados de acesso:", error);
    return [];
  }

  console.log(`AccessesPage (Server): Dados buscados com sucesso (${data?.length || 0} itens).`);
  return (data as PlatformAccess[]) || []; // Garante que retorna um array
}

// Função para buscar a 'role' do usuário logado
async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "admin" // Padrão
  const { data: employee } = await supabase.from("employees").select("system_role").eq("id", user.id).single()
  return employee?.system_role || "admin"
}


// O Server Component principal
export default async function AccessesPage() {
  const userRole = await getUserRole(); // Busca a role
  const initialAccesses = await getAccessData(userRole); // Passa a role para a busca

  // Renderiza o Client Component, passando os dados E a role
  return <AccessesClientPage initialAccesses={initialAccesses} userRole={userRole} />;
}
