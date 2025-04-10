"use client";

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useClientStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Client } from '@/lib/db';

interface ClientAutocompleteProps {
  value: number | null;
  onChange: (clientId: number | null) => void;
  placeholder?: string;
  required?: boolean;
}

export function ClientAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Select client", 
  required = false 
}: ClientAutocompleteProps) {
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

  // Set input value based on selected client
  useEffect(() => {
    if (value !== null) {
      const selectedClient = clients.find(client => client.id === value);
      if (selectedClient) {
        setInputValue(selectedClient.name);
      }
    } else {
      setInputValue('');
    }
  }, [value, clients]);

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

  // Filter clients based on input
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(inputValue.toLowerCase()))
  );

  // Handle direct input changes (typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear selection if input is cleared
    if (newValue.trim() === '') {
      onChange(null);
    }
    
    // Open dropdown when typing
    if (!open && newValue.trim() !== '') {
      setOpen(true);
    }
  };

  // Handle selection from dropdown
  const handleSelect = (client: Client) => {
    setInputValue(client.name);
    onChange(client.id as number);
    setOpen(false);
    inputRef.current?.focus();
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
      <div className="flex">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full"
          onClick={() => setOpen(true)}
          autoComplete="off"
        />
        <Button
          variant="outline"
          className="px-2 ml-1"
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
      
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
          <div className="max-h-[300px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="py-2 text-center text-sm">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
              <div className="py-2 text-center text-sm">No client found.</div>
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
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
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
