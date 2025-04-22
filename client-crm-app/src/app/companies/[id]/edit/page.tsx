"use client";

import { useEffect, use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/components/company-form";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useClientStore } from "@/lib/stores";

interface EditCompanyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCompanyPage({ params }: EditCompanyPageProps) {
  const router = useRouter();
  // Unwrap params using React.use() to avoid the warning
  const unwrappedParams = use(params);
  const companyId = parseInt(unwrappedParams.id, 10);
  
  const { 
    selectedCompany, 
    fetchCompanyById, 
    isLoadingCompanies, 
    removeCompany, 
    fetchCompanyWithClients, 
    clients 
  } = useClientStore();
  
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    fetchCompanyById(companyId);
    // Fetch company with clients to check if it has associated clients
    fetchCompanyWithClients(companyId);
  }, [companyId, fetchCompanyById, fetchCompanyWithClients]);
  
  const handleDelete = async () => {
    if (!selectedCompany) return;
    
    if (clients.length > 0) {
      alert(`Cannot delete company: This company has ${clients.length} associated clients. Please reassign or delete these clients first.`);
      return;
    }
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCompany.name}? This action cannot be undone.`
    );
    
    if (confirmed) {
      setIsDeleting(true);
      try {
        await removeCompany(companyId);
        alert("The company has been successfully deleted.");
        router.push('/companies');
      } catch (error) {
        alert(`Failed to delete company: ${(error as Error).message}`);
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href={`/companies/${companyId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Company
          </Link>
        </Button>
        
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          disabled={isDeleting || isLoadingCompanies}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
      
      {isLoadingCompanies ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        selectedCompany && <CompanyForm company={selectedCompany} isEditing={true} />
      )}
    </div>
  );
}
