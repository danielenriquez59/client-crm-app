"use client";

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useClientStore } from '@/lib/stores';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Client } from '@/lib/db';

interface ClientMultiSelectProps {
  value: number[];
  onChange: (clientIds: number[]) => void;
  placeholder?: string;
  required?: boolean;
}

export function ClientMultiSelect({ 
  value = [], 
  onChange, 
  placeholder = "Select clients", 
  required = false 
}: ClientMultiSelectProps) {
  const { clients, fetchClients } = useClientStore();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  
  // Fetch clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        await fetchClients();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClients();
  }, [fetchClients]);

  // Reset highlighted index when filtered clients change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [inputValue]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get selected clients
  const selectedClients = clients.filter(client => 
    value.includes(client.id as number)
  );

  // Filter clients based on input and exclude already selected clients
  const filteredClients = clients.filter(client => 
    !value.includes(client.id as number) && 
    (client.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(inputValue.toLowerCase())))
  );

  // Handle direct input changes (typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Open dropdown when typing
    if (!open && newValue.trim() !== '') {
      setOpen(true);
    }
  };

  // Handle selection from dropdown
  const handleSelect = (client: Client) => {
    // Add to selected clients if not already selected
    if (!value.includes(client.id as number)) {
      onChange([...value, client.id as number]);
    }
    
    // Reset input and focus
    setInputValue('');
    inputRef.current?.focus();
  };

  // Handle removing a selected client
  const handleRemove = (clientId: number) => {
    onChange(value.filter(id => id !== clientId));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredClients.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredClients.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredClients.length) {
          handleSelect(filteredClients[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      case 'Backspace':
        if (inputValue === '' && value.length > 0) {
          // Remove the last selected client when backspace is pressed with empty input
          handleRemove(value[value.length - 1]);
        }
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemsRef.current[highlightedIndex]) {
      itemsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  // Set up refs for dropdown items
  const setItemRef = (el: HTMLDivElement | null, index: number) => {
    if (el) {
      itemsRef.current[index] = el;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex flex-col w-full">
        <div className="flex items-center w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
          <div className="flex flex-wrap gap-1 flex-1 mr-2">
            {selectedClients.map(client => (
              <Badge 
                key={client.id} 
                variant="secondary" 
                className="px-2 py-0.5 h-6 gap-1 items-center"
              >
                {client.name}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(client.id as number);
                  }}
                  className="ml-1 rounded-full hover:bg-accent/50 p-0.5 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={selectedClients.length === 0 ? placeholder : ""}
              required={required && selectedClients.length === 0}
              className="w-full border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => setOpen(true)}
              autoComplete="off"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full"
            type="button"
            onClick={() => {
              setOpen(!open);
              if (!open) {
                inputRef.current?.focus();
              }
            }}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
          <div className="max-h-[300px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="py-2 text-center text-sm">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
              <div className="py-2 text-center text-sm">
                {inputValue ? "No matching clients found." : "All clients have been selected."}
              </div>
            ) : (
              filteredClients.map((client, index) => (
                <div
                  key={client.id}
                  ref={(el) => setItemRef(el, index)}
                  className={cn(
                    "flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer",
                    highlightedIndex === index ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(client)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex flex-col flex-1">
                    <span>{client.name}</span>
                    {client.company && (
                      <span className="text-xs text-muted-foreground">{client.company}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
