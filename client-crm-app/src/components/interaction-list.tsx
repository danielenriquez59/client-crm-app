"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Interaction } from '@/lib/db';
import { useClientStore } from '@/lib/store';
import { PlusCircle } from 'lucide-react';
import { InteractionForm } from './interaction-form';

interface InteractionListProps {
  clientId: number;
}

export function InteractionList({ clientId }: InteractionListProps) {
  const { interactions, fetchClientInteractions, isLoadingInteractions, interactionError } = useClientStore();
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClientInteractions(clientId);
    }
  }, [clientId, fetchClientInteractions]);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchClientInteractions(clientId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Interactions</h3>
        {!showAddForm && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAddForm(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Interaction
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6">
          <InteractionForm 
            clientId={clientId} 
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
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
      ) : interactions.length === 0 ? (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            No interactions recorded. Add your first interaction to get started.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {interactions.map((interaction) => (
            <InteractionCard key={interaction.id} interaction={interaction} />
          ))}
        </div>
      )}
    </div>
  );
}

function InteractionCard({ interaction }: { interaction: Interaction }) {
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
        <p className="text-sm whitespace-pre-wrap">{interaction.notes}</p>
      </CardContent>
    </Card>
  );
}
