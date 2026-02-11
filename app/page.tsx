import { auth } from "@/auth";
import { HomeLanding } from "./components/home-landing";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  let stats: any = null;

  if (isLoggedIn) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calls/stats/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session.user as any).accessToken}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        stats = await res.json();
      }
    } catch {
      stats = null;
    }
  }

  return (
    <HomeLanding
      isLoggedIn={isLoggedIn}
      userEmail={session?.user?.email ?? null}
      stats={stats}
    />
  );
}
