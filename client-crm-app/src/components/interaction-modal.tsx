"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { ClientMultiSelect } from './client-multi-select';
import { useClientStore } from '@/lib/stores';
import { Interaction } from '@/lib/db';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction?: Interaction; // Optional interaction for editing
  mode?: 'create' | 'edit';
}

export function InteractionModal({ isOpen, onClose, interaction, mode = 'create' }: InteractionModalProps) {
  const { clients, fetchClients, createInteraction, updateInteraction } = useClientStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    type: 'call',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Initialize form with interaction data when editing
  useEffect(() => {
    if (mode === 'edit' && interaction) {
      setFormData({
        type: interaction.type,
        date: new Date(interaction.date).toISOString().split('T')[0],
        notes: interaction.notes,
      });
      setSelectedClientIds(interaction.clientIds);
    } else {
      // Reset form for create mode
      setFormData({
        type: 'call',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setSelectedClientIds([]);
    }
  }, [mode, interaction, isOpen]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientsSelect = (clientIds: number[]) => {
    setSelectedClientIds(clientIds);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (selectedClientIds.length === 0) {
      setError('Please select at least one client');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const interactionData = {
        clientIds: selectedClientIds,
        type: formData.type as 'email' | 'call' | 'meeting' | 'other' | 'task',
        date: new Date(formData.date),
        notes: formData.notes,
      };

      if (mode === 'edit' && interaction?.id) {
        // Update existing interaction
        await updateInteraction(interaction.id, interactionData);
      } else {
        // Create new interaction
        await createInteraction(interactionData);
      }
      
      // Reset form and close modal
      setFormData({
        type: 'call',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setSelectedClientIds([]);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save interaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState: boolean) => !isSubmitting && !openState && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Interaction' : 'Add New Interaction'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the details of this interaction.' 
              : 'Record a new interaction with one or more clients.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Clients</Label>
            <ClientMultiSelect
              value={selectedClientIds}
              onChange={handleClientsSelect}
              placeholder="Search for clients..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can select multiple clients for group interactions
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter interaction details..."
              rows={4}
              required
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Save Interaction')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
