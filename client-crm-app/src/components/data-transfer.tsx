"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { exportDatabase, importDatabase } from '@/lib/db';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DataTransfer() {
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setExportStatus('exporting');
      setErrorMessage(null);
      
      // Export all tables from the database
      const data = await exportDatabase();
      
      // Convert to blob and create download link
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `client-crm-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown export error');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('importing');
      setErrorMessage(null);
      
      // Read the file
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Import the data into the database
      await importDatabase(data);
      
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown import error');
    } finally {
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Transfer</CardTitle>
        <CardDescription>Export data from this device or import from another device</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(exportStatus === 'error' || importStatus === 'error') && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleExport} 
            variant="outline" 
            className="w-full"
            disabled={exportStatus === 'exporting'}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportStatus === 'exporting' ? 'Exporting...' : 
             exportStatus === 'success' ? 'Exported Successfully!' : 
             'Export Data'}
          </Button>
          
          <div className="relative">
            <Button 
              variant="outline" 
              className="w-full"
              disabled={importStatus === 'importing'}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importStatus === 'importing' ? 'Importing...' : 
               importStatus === 'success' ? 'Imported Successfully!' : 
               'Import Data'}
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Note: Importing data will overwrite existing data in this browser.
      </CardFooter>
    </Card>
  );
}
