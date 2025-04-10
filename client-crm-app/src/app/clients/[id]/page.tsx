"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building, MapPin, Clock } from "lucide-react";
import { useClientStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedClient, fetchClientById, removeClient, isLoading, error } = useClientStore();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchClientById(Number(params.id));
    }
  }, [fetchClientById, params.id]);

  const handleDelete = async () => {
    if (!selectedClient?.id) return;
    
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await removeClient(selectedClient.id);
        router.push('/clients');
      } catch (error) {
        console.error('Failed to delete client:', error);
        setIsDeleting(false);
      }
    }
  };

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
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${selectedClient.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{selectedClient.name}</h2>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          selectedClient.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : selectedClient.status === 'inactive'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {selectedClient.status.charAt(0).toUpperCase() + selectedClient.status.slice(1)}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{selectedClient.email}</span>
            </div>
            {selectedClient.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{selectedClient.phone}</span>
              </div>
            )}
            {selectedClient.company && (
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{selectedClient.company}</span>
              </div>
            )}
            {selectedClient.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{selectedClient.location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Created: {formatDate(selectedClient.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Last Updated: {formatDate(selectedClient.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Interactions</h3>
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            No interactions found. Add your first interaction to get started.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Notes</h3>
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            No notes found. Add your first note to get started.
          </div>
        </div>
      </div>
    </div>
  );
}
