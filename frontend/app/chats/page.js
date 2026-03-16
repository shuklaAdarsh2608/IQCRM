"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/chats");
  }, [router]);
  return (
    <div className="flex min-h-[200px] items-center justify-center text-slate-500">
      Redirecting to team chat...
    </div>
  );
}
