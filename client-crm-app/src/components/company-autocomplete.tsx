"use client";

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useClientStore } from '@/lib/stores';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Company } from '@/lib/db';

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function CompanyAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Company name", 
  required = false 
}: CompanyAutocompleteProps) {
  const { companies, fetchCompanies, isLoadingCompanies } = useClientStore();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  
  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Reset highlighted index when filtered companies change
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

  // Filter companies based on input
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Handle direct input changes (typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    // Open dropdown when typing
    if (!open && newValue.trim() !== '') {
      setOpen(true);
    }
  };

  // Handle selection from dropdown
  const handleSelect = (company: Company) => {
    setInputValue(company.name);
    onChange(company.name);
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
          prev < filteredCompanies.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCompanies.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCompanies.length) {
          handleSelect(filteredCompanies[highlightedIndex]);
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
            {isLoadingCompanies ? (
              <div className="py-2 text-center text-sm">Loading companies...</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="py-2 text-center text-sm">No company found. Type to add a new one.</div>
            ) : (
              filteredCompanies.map((company, index) => (
                <div
                  key={company.id}
                  ref={(el) => setItemRef(el, index)}
                  className={cn(
                    "flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer",
                    highlightedIndex === index ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(company)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      inputValue === company.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {company.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
