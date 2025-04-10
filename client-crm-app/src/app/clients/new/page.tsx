"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/clients">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Add New Client</h2>
      </div>

      <ClientForm />
    </div>
  );
}
