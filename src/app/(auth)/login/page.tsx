import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import AuthForm from "@/components/AuthForm";

export default async function LoginPage() {
  if (await getCurrentUserId()) redirect("/groups");
  return <AuthForm mode="login" />;
}
