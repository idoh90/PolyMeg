import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import AuthForm from "@/components/AuthForm";

export default async function SignupPage() {
  if (await getCurrentUserId()) redirect("/groups");
  return <AuthForm mode="signup" />;
}
