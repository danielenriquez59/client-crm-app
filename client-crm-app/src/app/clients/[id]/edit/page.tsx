"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/client-form";
import { useClientStore } from "@/lib/store";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedClient, fetchClientById, isLoading, error } = useClientStore();

  useEffect(() => {
    if (params.id) {
      fetchClientById(Number(params.id));
    }
  }, [fetchClientById, params.id]);

  if (isLoading) {
    return <div className="text-center p-4">Loading client details...</div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild className="mb-6">
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
        <div className="p-4 text-center text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!selectedClient) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild className="mb-6">
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
        <div className="p-4 text-center">
          Client not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href={`/clients/${selectedClient.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Edit Client</h2>
      </div>

      <ClientForm client={selectedClient} isEditing={true} />
    </div>
  );
}
