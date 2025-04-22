"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClientStore } from '@/lib/stores';
import { ClientList } from '@/components/client-list';
import { Building, Globe, Pencil, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface CompanyDetailProps {
  companyId: number;
}

export function CompanyDetail({ companyId }: CompanyDetailProps) {
  const router = useRouter();
  const { 
    selectedCompany, 
    fetchCompanyWithClients, 
    removeCompany, 
    isLoadingCompanies: isLoading, 
    clients 
  } = useClientStore();
  
  useEffect(() => {
    fetchCompanyWithClients(companyId);
  }, [companyId, fetchCompanyWithClients]);
  
  const handleDelete = async () => {
    if (!selectedCompany) return;
    
    if (clients.length > 0) {
      alert(`Cannot delete company: This company has ${clients.length} associated clients. Please reassign or delete these clients first.`);
      return;
    }
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCompany.name}? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await removeCompany(companyId);
        alert("The company has been successfully deleted.");
        router.push('/companies');
      } catch (error) {
        alert(`Failed to delete company: ${(error as Error).message}`);
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!selectedCompany) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold">Company not found</h2>
        <p className="mt-2 text-muted-foreground">
          The company you are looking for does not exist or has been deleted.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/companies">Back to Companies</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{selectedCompany.name}</CardTitle>
            {selectedCompany.industry && (
              <CardDescription>{selectedCompany.industry}</CardDescription>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/companies/${companyId}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <Button variant="outline" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCompany.website && (
            <div className="flex items-center">
              <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
              <a 
                href={selectedCompany.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {selectedCompany.website}
              </a>
            </div>
          )}
          
          {selectedCompany.notes && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
                {selectedCompany.notes}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground mt-4">
            <div>
              <span>Created: </span>
              <span>{format(new Date(selectedCompany.createdAt), 'PPP')}</span>
            </div>
            <div>
              <span>Last updated: </span>
              <span>{format(new Date(selectedCompany.updatedAt), 'PPP')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Clients ({clients.length})</h3>
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients/new">Add Client</Link>
          </Button>
        </div>
        
        {clients.length > 0 ? (
          <ClientList companyId={companyId} showSearch={false} />
        ) : (
          <div className="text-center p-8 border rounded-md">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">No clients found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This company doesn't have any clients yet.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/clients/new">Add Client</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
