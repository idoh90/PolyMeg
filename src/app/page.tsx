import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";

export default async function Home() {
  redirect((await getCurrentUserId()) ? "/groups" : "/login");
}
