"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this interview session and its scores?"
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/interview/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        // Refresh the Server Component data immediately
        router.refresh();
      } else {
        alert("Failed to delete session.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to server.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-3.5 py-2 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition cursor-pointer disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "🗑 Delete"}
    </button>
  );
}