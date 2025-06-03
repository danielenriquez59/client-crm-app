"use client";

import { RecentInteractions } from "@/components/recent-interactions";

export default function InteractionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">All Interactions</h2>
      </div>

      <RecentInteractions />
    </div>
  );
}
