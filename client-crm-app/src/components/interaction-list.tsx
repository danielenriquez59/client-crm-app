"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Interaction, Client } from '@/lib/db';
import { useClientStore } from '@/lib/stores';
import { PlusCircle, Search } from 'lucide-react';
import { InteractionModal } from './interaction-modal';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface InteractionListProps {
  clientId: number;
}

export function InteractionList({ clientId }: InteractionListProps) {
  const { 
    interactions, 
    fetchClientInteractions, 
    fetchAllInteractions,
    clients,
    fetchClients,
    isLoadingInteractions, 
    interactionError 
  } = useClientStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInteractions, setFilteredInteractions] = useState<Interaction[]>([]);
  const isAllInteractions = clientId === 0;

  useEffect(() => {
    if (isAllInteractions) {
      fetchAllInteractions();
    } else {
      fetchClientInteractions(clientId);
    }
    fetchClients();
  }, [clientId, fetchClientInteractions, fetchAllInteractions, fetchClients, isAllInteractions]);

  // Filter interactions based on search term when viewing all interactions
  useEffect(() => {
    if (!isAllInteractions || searchTerm.trim() === '') {
      setFilteredInteractions(interactions);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      setFilteredInteractions(
        interactions.filter(
          (interaction) => {
            // Check if any of the clients associated with this interaction match the search
            const clientsForInteraction = interaction.clientIds.map(id => getClientName(id)?.name || '');
            return clientsForInteraction.some(name => name.toLowerCase().includes(lowercasedSearch)) ||
              interaction.type.toLowerCase().includes(lowercasedSearch) ||
              interaction.notes.toLowerCase().includes(lowercasedSearch);
          }
        )
      );
    }
  }, [interactions, searchTerm, isAllInteractions]);

  const handleCloseModal = () => {
    setShowAddModal(false);
    if (isAllInteractions) {
      fetchAllInteractions();
    } else {
      fetchClientInteractions(clientId);
    }
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

      {isAllInteractions && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search interactions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

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
      ) : (filteredInteractions.length === 0) ? (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            No interactions recorded. Add your first interaction to get started.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInteractions.map((interaction) => (
            <InteractionCard 
              key={interaction.id} 
              interaction={interaction} 
              getClientName={getClientName}
              currentClientId={clientId}
              isAllInteractions={isAllInteractions}
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
  isAllInteractions?: boolean;
}

function InteractionCard({ interaction, getClientName, currentClientId, isAllInteractions = false }: InteractionCardProps) {
  // Get the primary client (first in the array or use any available)
  const primaryClientId = interaction.clientIds[0];
  const primaryClient = getClientName(primaryClientId);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
            </CardTitle>
            <CardDescription>
              {isAllInteractions && primaryClient && (
                <Link href={`/clients/${primaryClient.id}`} className="hover:underline">
                  {primaryClient.name}
                </Link>
              )}
              {isAllInteractions && primaryClient && ' - '}
              {formatDate(interaction.date, true)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {interaction.clientIds && interaction.clientIds.length > 1 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {interaction.clientIds
              .filter(cId => isAllInteractions || cId !== currentClientId) // Don't show badge for current client unless in all view
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
