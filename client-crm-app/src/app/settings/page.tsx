"use client";

import { DataTransfer } from '@/components/data-transfer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataTransfer />
        
        <Card>
          <CardHeader>
            <CardTitle>About Data Transfer</CardTitle>
            <CardDescription>How to move your data between devices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Exporting Data</h3>
              <p className="text-sm text-muted-foreground">
                Export your data from your local environment before deploying to Vercel.
                This will download a JSON file containing all your clients, interactions, notes, and companies.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Importing Data</h3>
              <p className="text-sm text-muted-foreground">
                After deploying to Vercel, visit this settings page on your deployed site and import
                the JSON file you downloaded. This will restore all your data to the new environment.
              </p>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Note: Your data is stored locally in your browser using IndexedDB. 
                This export/import feature allows you to transfer data between different browsers or devices.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
