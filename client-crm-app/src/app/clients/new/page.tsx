"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Add New Client</h2>
        <Link href="/clients/bulk-add">
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Bulk Add Clients
          </Button>
        </Link>
      </div>

      <ClientForm />
    </div>
  );
}
