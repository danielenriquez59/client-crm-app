"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { formatDate } from '@/lib/utils';
import { useClientStore } from '@/lib/stores';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface RecentInteractionsProps {
  limit?: number;
}

export function RecentInteractions({ limit = 10 }: RecentInteractionsProps) {
  const { 
    interactions, 
    fetchAllInteractions, 
    isLoadingInteractions, 
    clients, 
    fetchClients 
  } = useClientStore();
  
  useEffect(() => {
    fetchAllInteractions();
    fetchClients();
  }, [fetchAllInteractions, fetchClients]);

  // Sort interactions by date (newest first) and limit to the specified number
  const recentInteractions = [...interactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  // Get client name by ID
  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Get interaction type with proper capitalization
  const formatInteractionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Handle delete interaction (placeholder for now)
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this interaction? This action cannot be undone.')) {
      // TODO: Implement delete interaction functionality
      console.log('Delete interaction', id);
      // After implementing, refresh the interactions list
      fetchAllInteractions();
    }
  };

  if (isLoadingInteractions) {
    return (
      <div className="space-y-2">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (recentInteractions.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-4 text-center text-muted-foreground">
          No interactions recorded yet.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Clients</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentInteractions.map((interaction) => (
            <TableRow key={interaction.id}>
              <TableCell className="font-medium">
                {formatDate(interaction.date)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {interaction.clientIds && interaction.clientIds.length > 0 ? (
                    interaction.clientIds.map((clientId) => (
                      <Link 
                        href={`/clients/${clientId}`}
                        key={clientId}
                        className="inline-block"
                      >
                        <Badge variant="secondary" className="hover:bg-secondary">
                          {getClientName(clientId)}
                        </Badge>
                      </Link>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No clients</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatInteractionType(interaction.type)}</TableCell>
              <TableCell className="max-w-xs truncate">
                {interaction.notes}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/interactions/${interaction.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/interactions/${interaction.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => interaction.id && handleDelete(interaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
