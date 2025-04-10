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
import { useClientStore } from '@/lib/store';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';

interface RecentInteractionsProps {
  limit?: number;
}

export function RecentInteractions({ limit = 10 }: RecentInteractionsProps) {
  const { interactions, fetchAllInteractions, isLoadingInteractions, clients, fetchClients } = useClientStore();
  
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
