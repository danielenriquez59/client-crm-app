"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Interaction } from '@/lib/db';
import { useClientStore } from '@/lib/store';

interface InteractionFormProps {
  clientId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InteractionForm({ clientId, onSuccess, onCancel }: InteractionFormProps) {
  const { createInteraction, isLoadingInteractions, interactionError } = useClientStore();
  
  const [formData, setFormData] = useState({
    type: 'email' as 'email' | 'call' | 'meeting' | 'other',
    notes: '',
    date: new Date().toISOString().split('T')[0], // Default to today's date
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!formData.notes.trim()) {
        throw new Error('Interaction notes are required');
      }
      
      await createInteraction({
        clientId,
        type: formData.type,
        date: new Date(formData.date),
        notes: formData.notes,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setFormData({
        type: 'email',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to create interaction');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Interaction</CardTitle>
      </CardHeader>
      <CardContent>
        {(error || interactionError) && (
          <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive">
            {error || interactionError}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Type <span className="text-destructive">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
                disabled={isSubmitting || isLoadingInteractions}
              >
                <option value="email">Email</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Date <span className="text-destructive">*</span>
              </label>
              <Input 
                id="date" 
                name="date"
                type="date" 
                value={formData.date}
                onChange={handleChange}
                required
                disabled={isSubmitting || isLoadingInteractions}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes <span className="text-destructive">*</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Describe the interaction..."
              required
              disabled={isSubmitting || isLoadingInteractions}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting || isLoadingInteractions}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoadingInteractions}
            >
              {isSubmitting || isLoadingInteractions ? 'Saving...' : 'Save Interaction'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
