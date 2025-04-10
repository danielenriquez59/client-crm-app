"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Interaction } from '@/lib/db';
import { useClientStore } from '@/lib/store';
import { Search } from 'lucide-react';

interface AllInteractionsListProps {
  showSearch?: boolean;
}

export function AllInteractionsList({ showSearch = true }: AllInteractionsListProps) {
  const { interactions, fetchAllInteractions, isLoadingInteractions, interactionError } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInteractions, setFilteredInteractions] = useState<Interaction[]>([]);
  const [clientNames, setClientNames] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchAllInteractions();
  }, [fetchAllInteractions]);

  // Get client names for all interactions
  useEffect(() => {
    const { clients, fetchClients } = useClientStore.getState();
    
    if (clients.length === 0) {
      fetchClients();
    }
    
    const nameMap: Record<number, string> = {};
    clients.forEach(client => {
      nameMap[client.id as number] = client.name;
    });
    
    setClientNames(nameMap);
  }, []);

  // Filter interactions based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInteractions(interactions);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      setFilteredInteractions(
        interactions.filter(
          (interaction) =>
            (clientNames[interaction.clientId] || '').toLowerCase().includes(lowercasedSearch) ||
            interaction.type.toLowerCase().includes(lowercasedSearch) ||
            interaction.notes.toLowerCase().includes(lowercasedSearch)
        )
      );
    }
  }, [interactions, searchTerm, clientNames]);

  return (
    <div className="space-y-4">
      {showSearch && (
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
      ) : filteredInteractions.length === 0 ? (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            No interactions found.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInteractions.map((interaction) => (
            <InteractionCard 
              key={interaction.id} 
              interaction={interaction} 
              clientName={clientNames[interaction.clientId] || 'Unknown Client'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface InteractionCardProps {
  interaction: Interaction;
  clientName: string;
}

function InteractionCard({ interaction, clientName }: InteractionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
            </CardTitle>
            <CardDescription>
              <Link href={`/clients/${interaction.clientId}`} className="hover:underline">
                {clientName}
              </Link> - {formatDate(interaction.date, true)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{interaction.notes}</p>
      </CardContent>
    </Card>
  );
}
