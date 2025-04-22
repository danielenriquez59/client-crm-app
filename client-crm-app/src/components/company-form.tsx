"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Company } from '@/lib/db';
import { useClientStore } from '@/lib/stores';

interface CompanyFormProps {
  company?: Company;
  isEditing?: boolean;
}

export function CompanyForm({ company, isEditing = false }: CompanyFormProps) {
  const router = useRouter();
  const { createCompany, updateCompanyData } = useClientStore();
  
  const [formData, setFormData] = useState({
    name: company?.name || '',
    industry: company?.industry || '',
    website: company?.website || '',
    notes: company?.notes || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!formData.name.trim()) {
        throw new Error('Company name is required');
      }
      
      if (isEditing && company?.id) {
        await updateCompanyData(company.id, formData);
        // Navigate back to the company detail page
        router.push(`/companies/${company.id}`);
      } else {
        // Create a new company and navigate to the companies list
        const newCompanyId = await createCompany(formData);
        router.push('/companies');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Company' : 'Company Information'}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input 
                id="name" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Company name" 
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="industry" className="text-sm font-medium">
                Industry
              </label>
              <Input 
                id="industry" 
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Technology, Healthcare" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="website" className="text-sm font-medium">
                Website
              </label>
              <Input 
                id="website" 
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com" 
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <Textarea 
                id="notes" 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional information about the company" 
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(isEditing && company?.id ? `/companies/${company.id}` : '/companies')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Company' : 'Save Company'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
