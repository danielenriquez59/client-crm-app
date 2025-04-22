"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Client } from '@/lib/db';
import { useClientStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Trash2, Plus, Download, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CompanySelector } from './company-selector';

interface ClientRowData {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyId?: number;
  location: string;
  status: 'active' | 'inactive' | 'evaluation';
}

export function BulkClientForm() {
  const router = useRouter();
  const { createClientWithCompany, fetchCompanies, companies } = useClientStore();
  
  const [clients, setClients] = useState<ClientRowData[]>([
    {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      companyName: '',
      companyId: undefined,
      location: '',
      status: 'active'
    }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [currentImportingClient, setCurrentImportingClient] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  
  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  const addRow = () => {
    setClients([
      ...clients,
      {
        id: Date.now().toString(),
        name: '',
        email: '',
        phone: '',
        companyName: '',
        companyId: undefined,
        location: '',
        status: 'active'
      }
    ]);
  };
  
  const removeRow = (id: string) => {
    if (clients.length === 1) {
      return; // Keep at least one row
    }
    setClients(clients.filter(client => client.id !== id));
  };
  
  const handleChange = (id: string, field: keyof ClientRowData, value: string) => {
    setClients(clients.map(client => 
      client.id === id ? { ...client, [field]: value } : client
    ));
  };
  
  const handleCompanyChange = (id: string, companyId: number | undefined) => {
    setClients(clients.map(client => {
      if (client.id === id) {
        // Find company name if companyId is provided
        let companyName = '';
        if (companyId) {
          const company = companies.find(c => c.id === companyId);
          if (company) {
            companyName = company.name;
          }
        }
        
        return { 
          ...client, 
          companyId, 
          companyName 
        };
      }
      return client;
    }));
  };
  
  const validateClients = () => {
    // Check for empty required fields
    const invalidClients = clients.filter(client => 
      !client.name.trim() || !client.email.trim()
    );
    
    if (invalidClients.length > 0) {
      return 'All clients must have a name and email';
    }
    
    // Check for duplicate emails
    const emails = clients.map(client => client.email.toLowerCase().trim());
    const uniqueEmails = new Set(emails);
    
    // if (emails.length !== uniqueEmails.size) {
    //   return 'Duplicate email addresses found';
    // }
    
    return null;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateClients();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessCount(0);
    setImportProgress(0);
    
    try {
      let successfulImports = 0;
      const totalClients = clients.length;
      
      // Process each client sequentially
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        try {
          setCurrentImportingClient(client.name);
          await createClientWithCompany({
            name: client.name,
            email: client.email,
            phone: client.phone,
            companyId: client.companyId,
            companyName: client.companyName,
            location: client.location,
            status: client.status
          });
          successfulImports++;
          // Update progress after each client (i+1 because we're 0-indexed)
          setImportProgress(Math.round(((i + 1) / totalClients) * 100));
        } catch (err) {
          console.error(`Failed to import client ${client.name}:`, err);
          // Continue with other clients even if one fails
          // Still update progress even for failed imports
          setImportProgress(Math.round(((i + 1) / totalClients) * 100));
        }
      }
      
      setSuccessCount(successfulImports);
      setCurrentImportingClient(null);
      
      if (successfulImports === clients.length) {
        // All clients imported successfully
        setTimeout(() => {
          router.push('/clients');
        }, 2000);
      } else {
        // Some clients failed to import
        setError(`Imported ${successfulImports} of ${clients.length} clients successfully`);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to import clients');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const exportTemplate = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Location', 'Status'];
    const csvContent = [
      headers.join(','),
      'John Doe,john@example.com,555-123-4567,Acme Inc,New York,active',
      'Jane Smith,jane@example.com,555-987-6543,XYZ Corp,Chicago,evaluation'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const importFromCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        // Skip header row
        if (lines.length < 2) {
          setError('CSV file is empty or invalid');
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.indexOf('name');
        const emailIndex = headers.indexOf('email');
        const phoneIndex = headers.indexOf('phone');
        const companyIndex = headers.indexOf('company');
        const locationIndex = headers.indexOf('location');
        const statusIndex = headers.indexOf('status');
        
        if (nameIndex === -1 || emailIndex === -1) {
          setError('CSV must contain at least Name and Email columns');
          return;
        }
        
        const importedClients: ClientRowData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          const status = values[statusIndex] || 'active';
          const validStatus = ['active', 'inactive', 'evaluation'].includes(status) 
            ? status as 'active' | 'inactive' | 'evaluation' 
            : 'active';
          
          importedClients.push({
            id: Date.now().toString() + i,
            name: values[nameIndex] || '',
            email: values[emailIndex] || '',
            phone: values[phoneIndex] || '',
            companyName: values[companyIndex] || '',
            companyId: undefined, // Will be resolved when importing
            location: values[locationIndex] || '',
            status: validStatus
          });
        }
        
        if (importedClients.length > 0) {
          setClients(importedClients);
          setError(null);
        } else {
          setError('No valid clients found in CSV');
        }
      } catch (err) {
        setError('Failed to parse CSV file');
        console.error('CSV import error:', err);
      }
    };
    
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Add Clients</CardTitle>
        <CardDescription>
          Add multiple clients at once using the table below or import from CSV.
        </CardDescription>
        <div className="flex gap-2 mt-4">
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={importFromCsv}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>          
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={exportTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            Get Sample Template
          </Button>

        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive">
            {error}
          </div>
        )}
        
        {successCount > 0 && (
          <div className="mb-4 p-3 rounded-md bg-green-500/15 text-green-600">
            Successfully imported {successCount} clients! Redirecting to clients list...
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="rounded-md border mb-4 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name*</TableHead>
                  <TableHead>Email*</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Input
                        value={client.name}
                        onChange={(e) => handleChange(client.id, 'name', e.target.value)}
                        placeholder="Client name"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="email"
                        value={client.email}
                        onChange={(e) => handleChange(client.id, 'email', e.target.value)}
                        placeholder="client@example.com"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={client.phone}
                        onChange={(e) => handleChange(client.id, 'phone', e.target.value)}
                        placeholder="(123) 456-7890"
                      />
                    </TableCell>
                    <TableCell>
                      <CompanySelector
                        value={client.companyId}
                        onChange={(companyId) => handleCompanyChange(client.id, companyId)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={client.location}
                        onChange={(e) => handleChange(client.id, 'location', e.target.value)}
                        placeholder="City, State"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={client.status}
                        onValueChange={(value) => handleChange(client.id, 'status', value as 'active' | 'inactive' | 'evaluation')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="evaluation">evaluation</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(client.id)}
                        disabled={clients.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addRow}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/clients')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Importing...' : 'Import Clients'}
              </Button>
              {isSubmitting && (
                <div className="ml-2 text-sm text-muted-foreground flex items-center">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      Currently importing: <span className="font-medium ml-1">{currentImportingClient}</span>
                    </div>
                    <div className="flex items-center">
                      Progress: <span className="font-medium ml-1">{importProgress}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
