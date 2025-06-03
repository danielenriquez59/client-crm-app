"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      // Redirect to login page
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
