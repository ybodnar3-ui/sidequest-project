import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Landing } from "./Landing";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");
  return <Landing />;
}
