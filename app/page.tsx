import { redirect } from "next/navigation";

export default function HomePage() {
  // Redireciona imediatamente para a área protegida
  redirect("/dashboard");
}
