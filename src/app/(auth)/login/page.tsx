import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import AuthForm from "@/components/AuthForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/groups");
  return <AuthForm mode="login" />;
}
