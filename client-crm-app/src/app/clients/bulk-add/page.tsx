"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BulkClientForm } from "@/components/bulk-client-form";

export default function BulkAddClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Bulk Add Clients</h2>
        <Link href="/clients/new">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Single Client
          </Button>
        </Link>
      </div>

      <BulkClientForm />
    </div>
  );
}
