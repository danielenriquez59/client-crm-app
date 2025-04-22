"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClientStore } from '@/lib/stores';
import { formatDate } from '@/lib/utils';
import { Client } from '@/lib/db';
import { Edit, Trash2, Eye, Search } from 'lucide-react';

interface ClientListProps {
  limit?: number;
  showSearch?: boolean;
}

export function ClientList({ limit, showSearch = true }: ClientListProps) {
  const { clients, fetchClients, fetchRecentClients, removeClient, isLoading, error } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  useEffect(() => {
    if (limit) {
      fetchRecentClients(limit);
    } else {
      fetchClients();
    }
  }, [fetchClients, fetchRecentClients, limit]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      setFilteredClients(
        clients.filter(
          (client) =>
            client.name.toLowerCase().includes(lowercasedSearch) ||
            client.email.toLowerCase().includes(lowercasedSearch) ||
            (client.company && client.company.toLowerCase().includes(lowercasedSearch))
        )
      );
    }
  }, [clients, searchTerm]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      await removeClient(id);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            Loading clients...
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-md border">
          <div className="p-4 text-center text-destructive">
            {error}
          </div>
        </div>
      );
    }

    if (filteredClients.length === 0) {
      return (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm.trim() !== '' 
              ? 'No clients match your search criteria.' 
              : 'No clients found. Add your first client to get started.'}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-md border">
          <p className="m-2">{filteredClients.length} clients</p>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Company</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Last Updated</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">
                    <Link 
                      href={`/clients/${client.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{client.email}</td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">{client.company || '-'}</td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : client.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm hidden lg:table-cell">
                    {formatDate(client.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/clients/${client.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/clients/${client.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => client.id && handleDelete(client.id)}
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
    );
  };

  return (
    <div className="space-y-4">
      {showSearch && !limit && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}
      {renderContent()}
    </div>
  );
}
