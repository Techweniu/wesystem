import { createClient } from "@supabase/supabase-js";
import { AccessesClientPage } from "./accesses-client-page";

// CONFIGURAÇÃO DE CACHE:
// Força a página a ser dinâmica e não usar cache estático.
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
  // CORREÇÃO CRÍTICA:
  // Usamos 'createClient' do pacote básico com a chave de serviço (SERVICE_ROLE_KEY).
  // Isso ignora as regras de segurança (RLS) do banco, permitindo que a
  // página liste TODOS os acessos (Produção, Mkt, etc.), não apenas os do seu departamento.
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
