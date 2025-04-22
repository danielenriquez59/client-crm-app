"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClientStore } from '@/lib/stores';
import { Building, ExternalLink, Pencil, Trash2, Eye, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Company } from '@/lib/db';

interface CompanyListProps {
  limit?: number;
  showSearch?: boolean;
}

// Define sort types
type SortField = 'name' | 'industry' | 'clientCount' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export function CompanyList({ limit, showSearch = true }: CompanyListProps) {
  const { companies, fetchCompanies, removeCompany, isLoadingCompanies, error } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<(Company & { clientCount?: number })[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  useEffect(() => {
    // Filter companies based on search term
    let filtered = companies;
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = companies.filter(
        (company) =>
          company.name.toLowerCase().includes(lowercasedSearch) ||
          (company.industry && company.industry.toLowerCase().includes(lowercasedSearch)) ||
          (company.website && company.website.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    // Sort the filtered companies
    const sorted = [...filtered].sort((a, b) => {
      // Handle different field types
      switch (sortField) {
        case 'name':
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        
        case 'industry':
          const industryA = a.industry || '';
          const industryB = b.industry || '';
          return sortDirection === 'asc' 
            ? industryA.localeCompare(industryB) 
            : industryB.localeCompare(industryA);
        
        case 'clientCount':
          const countA = a.clientCount || 0;
          const countB = b.clientCount || 0;
          return sortDirection === 'asc' 
            ? countA - countB 
            : countB - countA;
        
        case 'updatedAt':
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return sortDirection === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
            
        default:
          return 0;
      }
    });
    
    // Apply limit if specified
    setFilteredCompanies(limit ? sorted.slice(0, limit) : sorted);
  }, [companies, searchTerm, limit, sortField, sortDirection]);
  
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
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4 inline" /> 
      : <ChevronDown className="ml-1 h-4 w-4 inline" />;
  };
  
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
      <div className="rounded-md border bg-white shadow-md">
        <p className="m-2">{filteredCompanies.length} companies</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th 
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort('name')}
                >
                  Name {renderSortIcon('name')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort('industry')}
                >
                  Industry {renderSortIcon('industry')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-medium cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort('clientCount')}
                >
                  Clients {renderSortIcon('clientCount')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Website</th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSort('updatedAt')}
                >
                  Last Updated {renderSortIcon('updatedAt')}
                </th>
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
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      (company.clientCount || 0) > 0 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.clientCount || 0}
                    </span>
                  </td>
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
