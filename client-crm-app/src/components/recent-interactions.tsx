"use client";

import { useState, useEffect } from 'react';
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
import { Interaction } from '@/lib/db';
import { Trash2, MessageSquare, ChevronUp, ChevronDown, User, Building, Edit } from 'lucide-react';

interface RecentInteractionsProps {
  limit?: number;
  onEdit?: (interaction: Interaction) => void;
}

// Define sort types
type SortField = 'date' | 'type' | 'notes' | 'client' | 'company';
type SortDirection = 'asc' | 'desc';

export function RecentInteractions({ limit, onEdit }: RecentInteractionsProps) {
  const { 
    interactions, 
    fetchAllInteractions, 
    isLoading, 
    removeInteraction, 
    clients, 
    fetchClients,
    companies,
    fetchCompanies 
  } = useClientStore();
  
  const [recentInteractions, setRecentInteractions] = useState<(Interaction & { 
    clientNames: string,
    companyNames: string 
  })[]>([]);
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchAllInteractions();
    fetchClients();
    fetchCompanies();
  }, [fetchAllInteractions, fetchClients, fetchCompanies]);

  useEffect(() => {
    // Add client names and company names to interactions
    const interactionsWithDetails = interactions.map(interaction => {
      // Get client information
      const interactionClients = interaction.clientIds
        .map(clientId => clients.find(client => client.id === clientId))
        .filter(client => client !== undefined);
      
      // Get client names
      const clientNames = interactionClients
        .map(client => client?.name || 'Unknown')
        .join(', ');
      
      // Get unique company IDs from the clients
      const companyIds = [...new Set(
        interactionClients
          .map(client => client?.companyId)
          .filter(id => id !== undefined)
      )] as number[];
      
      // Get company names
      const companyNames = companyIds
        .map(companyId => companies.find(company => company.id === companyId)?.name || 'Unknown')
        .join(', ');
      
      return {
        ...interaction,
        clientNames,
        companyNames
      };
    });

    // Sort interactions
    const sorted = [...interactionsWithDetails].sort((a, b) => {
      // Handle different field types
      switch (sortField) {
        case 'date':
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortDirection === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
        
        case 'type':
          return sortDirection === 'asc' 
            ? a.type.localeCompare(b.type) 
            : b.type.localeCompare(a.type);
        
        case 'notes':
          return sortDirection === 'asc' 
            ? a.notes.localeCompare(b.notes) 
            : b.notes.localeCompare(a.notes);
            
        case 'client':
          return sortDirection === 'asc' 
            ? a.clientNames.localeCompare(b.clientNames) 
            : b.clientNames.localeCompare(a.clientNames);
            
        case 'company':
          return sortDirection === 'asc' 
            ? a.companyNames.localeCompare(b.companyNames) 
            : b.companyNames.localeCompare(a.companyNames);
            
        default:
          return 0;
      }
    });
    
    // Apply limit if specified
    setRecentInteractions(limit ? sorted.slice(0, limit) : sorted);
  }, [interactions, clients, companies, limit, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as the sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />;
  };

  const handleEdit = (interaction: Interaction) => {
    if (onEdit) {
      onEdit(interaction);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (recentInteractions.length === 0) {
    return (
      <div className="rounded-md border bg-white shadow-md">
        <div className="p-4 text-center text-muted-foreground">
          No interactions recorded yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border bg-white shadow-md">
        <p className="m-2">{recentInteractions.length} interactions</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th 
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort('date')}
                >
                  Date {renderSortIcon('date')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort('client')}
                >
                  Client {renderSortIcon('client')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort('company')}
                >
                  Company {renderSortIcon('company')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort('type')}
                >
                  Type {renderSortIcon('type')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70 hidden md:table-cell"
                  onClick={() => handleSort('notes')}
                >
                  Notes {renderSortIcon('notes')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentInteractions.map((interaction) => (
                <tr key={interaction.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatDate(interaction.date)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline" className="font-normal">
                      <User className="mr-1 h-3 w-3" />
                      {interaction.clientNames}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {interaction.companyNames ? (
                      <Badge variant="outline" className="font-normal bg-muted/30">
                        <Building className="mr-1 h-3 w-3" />
                        {interaction.companyNames}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">No company</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="secondary">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      {interaction.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
                    <div className="max-w-lg ">
                      {interaction.notes || <span className="text-muted-foreground italic">No notes</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(interaction)}
                        className="text-primary hover:text-primary/90 hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeInteraction(interaction.id!)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
