"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Interaction, Client } from '@/lib/db';
import { useClientStore } from '@/lib/stores';
import { PlusCircle } from 'lucide-react';
import { InteractionModal } from './interaction-modal';
import { Badge } from './ui/badge';
import Link from 'next/link';

interface InteractionListProps {
  clientId: number;
}

export function InteractionList({ clientId }: InteractionListProps) {
  const { 
    interactions, 
    fetchClientInteractions, 
    clients,
    fetchClients,
    isLoadingInteractions, 
    interactionError 
  } = useClientStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClientInteractions(clientId);
      fetchClients();
    }
  }, [clientId, fetchClientInteractions, fetchClients]);

  const handleCloseModal = () => {
    setShowAddModal(false);
    fetchClientInteractions(clientId);
  };

  // Get client name by ID
  const getClientName = (clientId: number): Client | undefined => {
    return clients.find(c => c.id === clientId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Interactions</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAddModal(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Interaction
        </Button>
      </div>

      {showAddModal && (
        <InteractionModal 
          isOpen={showAddModal} 
          onClose={handleCloseModal}
        />
      )}

      {isLoadingInteractions ? (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            Loading interactions...
          </div>
        </div>
      ) : interactionError ? (
        <div className="rounded-md border">
          <div className="p-4 text-center text-destructive">
            {interactionError}
          </div>
        </div>
      ) : interactions.length === 0 ? (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            No interactions recorded. Add your first interaction to get started.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {interactions.map((interaction) => (
            <InteractionCard 
              key={interaction.id} 
              interaction={interaction} 
              getClientName={getClientName}
              currentClientId={clientId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface InteractionCardProps {
  interaction: Interaction;
  getClientName: (id: number) => Client | undefined;
  currentClientId: number;
}

function InteractionCard({ interaction, getClientName, currentClientId }: InteractionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
            </CardTitle>
            <CardDescription>
              {formatDate(interaction.date, true)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {interaction.clientIds && interaction.clientIds.length > 1 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {interaction.clientIds
              .filter(cId => cId !== currentClientId) // Don't show badge for current client
              .map(clientId => {
                const client = getClientName(clientId);
                return client ? (
                  <Link href={`/clients/${client.id}`} key={client.id}>
                    <Badge variant="secondary" className="hover:bg-secondary">
                      {client.name}
                    </Badge>
                  </Link>
                ) : null;
              })}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{interaction.notes}</p>
      </CardContent>
    </Card>
  );
}
