"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useClientStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { InteractionList } from "@/components/interaction-list";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedClient, fetchClientById, removeClient, isLoading, error } = useClientStore();

  useEffect(() => {
    if (params.id) {
      fetchClientById(Number(params.id));
    }
  }, [fetchClientById, params.id]);

  const handleDelete = async () => {
    if (!selectedClient?.id) return;
    
    if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      await removeClient(selectedClient.id);
      router.push("/clients");
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading client details...</div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-4 text-center text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!selectedClient) {
    return (
      <div className="space-y-6">
        <div className="p-4 text-center">
          Client not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${selectedClient.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="text-base">{selectedClient.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="text-base">{selectedClient.email}</dd>
              </div>
              {selectedClient.phone && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                  <dd className="text-base">{selectedClient.phone}</dd>
                </div>
              )}
              {selectedClient.company && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Company</dt>
                  <dd className="text-base">{selectedClient.company}</dd>
                </div>
              )}
              {selectedClient.location && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                  <dd className="text-base">{selectedClient.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    selectedClient.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedClient.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedClient.status.charAt(0).toUpperCase() + selectedClient.status.slice(1)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Added</dt>
                <dd className="text-base">{formatDate(selectedClient.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd className="text-base">{formatDate(selectedClient.updatedAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Client Interactions Section */}
          {selectedClient.id && <InteractionList clientId={selectedClient.id} />}
        </div>
      </div>
    </div>
  );
}
