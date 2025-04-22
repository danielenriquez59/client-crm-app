"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useClientStore } from '@/lib/stores';
import { Building, ExternalLink, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CompanyListProps {
  limit?: number;
}

export function CompanyList({ limit }: CompanyListProps) {
  const { companies, fetchCompanies, isLoadingCompanies } = useClientStore();
  
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  const displayCompanies = limit ? companies.slice(0, limit) : companies;
  
  if (isLoadingCompanies) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (displayCompanies.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md">
        <Building className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">No companies found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating a new company.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/companies/new">Create Company</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayCompanies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">
                <Link 
                  href={`/companies/${company.id}`}
                  className="hover:underline"
                >
                  {company.name}
                </Link>
              </TableCell>
              <TableCell>{company.industry || '-'}</TableCell>
              <TableCell>
                {company.website ? (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    {new URL(company.website).hostname}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {company.updatedAt 
                  ? formatDistanceToNow(new Date(company.updatedAt), { addSuffix: true }) 
                  : '-'
                }
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/companies/${company.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
