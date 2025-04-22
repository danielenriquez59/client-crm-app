"use client";

import { useState, useEffect } from 'react';
import { useClientStore } from '@/lib/store';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CompanySelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  onCompanyNameChange?: (name: string) => void;
  required?: boolean;
}

export function CompanySelector({ 
  value, 
  onChange, 
  onCompanyNameChange,
  required = false 
}: CompanySelectorProps) {
  const { companies, fetchCompanies, createCompany } = useClientStore();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      setError('Company name is required');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      const companyId = await createCompany({
        name: newCompanyName.trim(),
        industry: newCompanyIndustry.trim() || undefined
      });
      
      onChange(companyId);
      if (onCompanyNameChange) {
        onCompanyNameChange(newCompanyName.trim());
      }
      
      // Reset form
      setNewCompanyName('');
      setNewCompanyIndustry('');
      setIsOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleSelectChange = (value: string) => {
    if (value === 'new') {
      setIsOpen(true);
    } else if (value === 'none') {
      onChange(undefined);
      if (onCompanyNameChange) {
        onCompanyNameChange('');
      }
    } else {
      const companyId = parseInt(value, 10);
      onChange(companyId);
      
      // Also update company name if callback provided
      if (onCompanyNameChange) {
        const company = companies.find(c => c.id === companyId);
        if (company) {
          onCompanyNameChange(company.name);
        }
      }
    }
  };
  
  return (
    <div>
      <Select 
        value={value?.toString() || 'none'} 
        onValueChange={handleSelectChange}
      >
        <SelectTrigger className={required ? 'border-red-500' : ''}>
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {companies.map(company => (
            <SelectItem key={company.id} value={company.id?.toString() || ''}>
              {company.name}
            </SelectItem>
          ))}
          <SelectItem value="new" className="text-primary font-medium">
            <div className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add new company
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="company-name" className="text-sm font-medium">
                Company Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="company-industry" className="text-sm font-medium">
                Industry
              </label>
              <Input
                id="company-industry"
                value={newCompanyIndustry}
                onChange={(e) => setNewCompanyIndustry(e.target.value)}
                placeholder="e.g. Technology, Healthcare"
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleCreateCompany} 
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
