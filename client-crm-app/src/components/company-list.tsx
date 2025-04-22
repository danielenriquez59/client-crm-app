"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClientStore } from '@/lib/stores';
import { Building, ExternalLink, Pencil, Trash2, Eye, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Company } from '@/lib/db';

interface CompanyListProps {
  limit?: number;
  showSearch?: boolean;
}

export function CompanyList({ limit, showSearch = true }: CompanyListProps) {
  const { companies, fetchCompanies, removeCompany, isLoadingCompanies, error } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCompanies(limit ? companies.slice(0, limit) : companies);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      setFilteredCompanies(
        companies.filter(
          (company) =>
            company.name.toLowerCase().includes(lowercasedSearch) ||
            (company.industry && company.industry.toLowerCase().includes(lowercasedSearch)) ||
            (company.website && company.website.toLowerCase().includes(lowercasedSearch))
        )
      );
    }
  }, [companies, searchTerm, limit]);
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      await removeCompany(id);
    }
  };

  const renderContent = () => {
    if (isLoadingCompanies) {
      return (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            Loading companies...
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
    
    if (filteredCompanies.length === 0) {
      return (
        <div className="rounded-md border">
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm.trim() !== '' 
              ? 'No companies match your search criteria.' 
              : 'No companies found. Add your first company to get started.'}
          </div>
        </div>
      );
    }
    
    return (
      <div className="rounded-md border">
        <p className="m-2">{filteredCompanies.length} companies</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Industry</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Website</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Last Updated</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">
                    <Link 
                      href={`/companies/${company.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{company.industry || '-'}</td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
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
                  </td>
                  <td className="px-4 py-3 text-sm hidden lg:table-cell">
                    {company.updatedAt 
                      ? formatDistanceToNow(new Date(company.updatedAt), { addSuffix: true }) 
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/companies/${company.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/companies/${company.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => company.id && handleDelete(company.id)}
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
            placeholder="Search companies..."
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
