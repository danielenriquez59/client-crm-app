"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Client } from '@/lib/db';
import { useClientStore } from '@/lib/stores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Trash2, Plus, Download, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ClientRowData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  status: 'active' | 'inactive' | 'evaluation';
}

export function BulkClientForm() {
  const router = useRouter();
  const { 
    createClientWithCompany, 
    fetchCompanies, 
    companies, 
    createBulkClients, 
    createBulkCompanies 
  } = useClientStore();
  
  const [clients, setClients] = useState<ClientRowData[]>([
    {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      company: '',
      location: '',
      status: 'active'
    }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [currentImportingClient, setCurrentImportingClient] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<'idle' | 'companies' | 'clients'>('idle');
  
  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  const addClient = () => {
    setClients([
      ...clients,
      {
        id: Date.now().toString(),
        name: '',
        email: '',
        phone: '',
        company: '',
        location: '',
        status: 'active'
      }
    ]);
  };
  
  const removeClient = (id: string) => {
    if (clients.length === 1) return;
    setClients(clients.filter(client => client.id !== id));
  };
  
  const handleChange = (id: string, field: keyof ClientRowData, value: string) => {
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, [field]: value } : client
      )
    );
  };
  
  // Extract unique company names from client entries
  const extractUniqueCompanyNames = (clientData: ClientRowData[]): string[] => {
    const companyNames = clientData
      .map(client => client.company.trim())
      .filter(name => name !== '');
    
    // Remove duplicates by converting to Set and back to array
    return [...new Set(companyNames)];
  };
  
  // Process companies - check existing ones and create new ones
  const processCompanies = async (uniqueCompanyNames: string[]): Promise<Map<string, number>> => {
    setProcessingStage('companies');
    
    // Create a map to store company name -> id mapping
    const companyMap = new Map<string, number>();
    
    // Map existing companies
    for (const company of companies) {
      companyMap.set(company.name.toLowerCase(), company.id!);
    }
    
    // Find company names that don't exist yet
    const companiesToCreate: { name: string }[] = [];
    
    for (const name of uniqueCompanyNames) {
      if (!companyMap.has(name.toLowerCase())) {
        companiesToCreate.push({ name });
      }
    }
    
    // Create new companies if needed
    if (companiesToCreate.length > 0) {
      try {
        const newCompanyIds = await createBulkCompanies(companiesToCreate);
        
        // Add new companies to the map
        for (let i = 0; i < companiesToCreate.length; i++) {
          const companyName = companiesToCreate[i].name;
          const companyId = newCompanyIds[i];
          companyMap.set(companyName.toLowerCase(), companyId);
        }
      } catch (error) {
        console.error('Failed to create companies:', error);
        throw new Error('Failed to create companies');
      }
    }
    
    return companyMap;
  };
  
  // Process clients using the company mapping
  const processClients = async (clientData: ClientRowData[], companyMap: Map<string, number>): Promise<number[]> => {
    setProcessingStage('clients');
    
    // Format clients with company IDs
    const clientsToCreate = clientData.map(client => ({
      name: client.name,
      email: client.email,
      phone: client.phone,
      companyId: client.company ? companyMap.get(client.company.toLowerCase()) : undefined,
      location: client.location,
      status: client.status
    }));
    
    // Bulk create clients
    return await createBulkClients(clientsToCreate);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const invalidClients = clients.filter(client => !client.name || !client.email);
    if (invalidClients.length > 0) {
      setError('All clients must have a name and email');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessCount(0);
    setImportProgress(0);
    setProcessingStage('idle');
    
    try {
      // 1. Extract unique company names
      const uniqueCompanyNames = extractUniqueCompanyNames(clients);
      setCurrentImportingClient('Processing companies...');
      setImportProgress(10);
      
      // 2. Process companies - check existing ones and create new ones
      const companyMap = await processCompanies(uniqueCompanyNames);
      setImportProgress(40);
      
      // 3. Process clients using the company mapping
      setCurrentImportingClient('Creating clients...');
      const clientIds = await processClients(clients, companyMap);
      setImportProgress(100);
      
      // 4. Show success message and redirect
      setSuccessCount(clientIds.length);
      setCurrentImportingClient(null);
      setProcessingStage('idle');
      
      if (clientIds.length === clients.length) {
        // All clients imported successfully
        setTimeout(() => {
          router.push('/clients');
        }, 2000);
      } else {
        // Some clients failed to import
        setError(`Imported ${clientIds.length} of ${clients.length} clients successfully`);
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
        const csvContent = event.target?.result as string;
        const rows = csvContent.split('\n');
        
        // Parse header row to find column indices
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.indexOf('name');
        const emailIndex = headers.indexOf('email');
        const phoneIndex = headers.indexOf('phone');
        const companyIndex = headers.indexOf('company');
        const locationIndex = headers.indexOf('location');
        const statusIndex = headers.indexOf('status');
        
        if (nameIndex === -1 || emailIndex === -1) {
          setError('CSV must include Name and Email columns');
          return;
        }
        
        const importedClients: ClientRowData[] = [];
        
        // Start from row 1 (skip headers)
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const values = rows[i].split(',').map(v => v.trim());
          
          // Validate required fields
          if (!values[nameIndex] || !values[emailIndex]) continue;
          
          // Validate status if present
          let validStatus: 'active' | 'inactive' | 'evaluation' = 'active';
          if (statusIndex !== -1 && values[statusIndex]) {
            const status = values[statusIndex].toLowerCase();
            if (['active', 'inactive', 'evaluation'].includes(status)) {
              validStatus = status as 'active' | 'inactive' | 'evaluation';
            }
          }
          
          importedClients.push({
            id: Date.now().toString() + i, // Ensure unique ID
            name: values[nameIndex],
            email: values[emailIndex],
            phone: values[phoneIndex] || '',
            company: values[companyIndex] || '',
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
            Download Template
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {successCount > 0 && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Successfully imported {successCount} clients!
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
                      <Input
                        value={client.company}
                        onChange={(e) => handleChange(client.id, 'company', e.target.value)}
                        placeholder="Company name"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={client.location}
                        onChange={(e) => handleChange(client.id, 'location', e.target.value)}
                        placeholder="Location"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={client.status}
                        onValueChange={(value) => handleChange(client.id, 'status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="evaluation">Evaluation</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeClient(client.id)}
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
          
          <div className="flex justify-between items-start mb-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addClient}
              disabled={isSubmitting}
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
                      {processingStage === 'companies' && 'Processing companies...'}
                      {processingStage === 'clients' && 'Creating clients...'}
                      {processingStage === 'idle' && currentImportingClient && (
                        <>Currently importing: <span className="font-medium ml-1">{currentImportingClient}</span></>
                      )}
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
