"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Client } from '@/lib/db';
import { useClientStore } from '@/lib/stores';
import { CompanySelector } from './company-selector';

interface ClientFormProps {
  client?: Client;
  isEditing?: boolean;
}

export function ClientForm({ client, isEditing = false }: ClientFormProps) {
  const router = useRouter();
  const { createClientWithCompany, updateClientData, companies, fetchCompanies } = useClientStore();
  
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    companyName: '',
    companyId: client?.companyId,
    location: client?.location || '',
    status: client?.status || 'active' as 'active' | 'inactive' | 'evaluation',
  });
  
  // Fetch company name if client has companyId
  useEffect(() => {
    if (client?.companyId && companies.length > 0) {
      const company = companies.find(c => c.id === client.companyId);
      if (company) {
        setFormData(prev => ({ ...prev, companyName: company.name }));
      }
    }
  }, [client, companies]);
  
  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (companyId: number | undefined) => {
    setFormData(prev => ({ ...prev, companyId }));
  };
  
  const handleCompanyNameChange = (companyName: string) => {
    setFormData(prev => ({ ...prev, companyName }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!formData.name.trim()) {
        throw new Error('Client name is required');
      }
      
      if (!formData.email.trim()) {
        throw new Error('Client email is required');
      }
      
      if (isEditing && client?.id) {
        await updateClientData(client.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          companyId: formData.companyId,
          location: formData.location,
          status: formData.status
        });
        // Navigate back to the client detail page
        router.push(`/clients/${client.id}`);
      } else {
        // Create a new client with company and navigate to the clients list
        const newClientId = await createClientWithCompany({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          location: formData.location,
          status: formData.status
        });
        router.push('/clients');
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
        <CardTitle>{isEditing ? 'Edit Client' : 'Client Information'}</CardTitle>
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
                placeholder="Client name" 
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleChange}
                placeholder="client@example.com" 
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone
              </label>
              <Input 
                id="phone" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(123) 456-7890" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="companyId" className="text-sm font-medium">
                Company
              </label>
              <CompanySelector
                value={formData.companyId}
                onChange={handleCompanyChange}
                onCompanyNameChange={handleCompanyNameChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input 
                id="location" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="evaluation">evaluation</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(isEditing && client?.id ? `/clients/${client.id}` : '/clients')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Client' : 'Save Client'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
