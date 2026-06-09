import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Привіт, мандрівнику 👋</h1>
      <p className="text-center text-gray-600">
        Тут зʼявлятиметься твій квест дня. Поки що порожньо — будуємо далі.
      </p>
      <form action="/auth/signout" method="post">
        <button className="rounded-lg border px-4 py-2 text-sm" type="submit">
          Вийти
        </button>
      </form>
    </main>
  );
}
