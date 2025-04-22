"use client";

import { useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/components/company-form";
import { ArrowLeft } from "lucide-react";
import { useClientStore } from "@/lib/store";

interface EditCompanyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCompanyPage({ params }: EditCompanyPageProps) {
  // Unwrap params using React.use() to avoid the warning
  const unwrappedParams = use(params);
  const companyId = parseInt(unwrappedParams.id, 10);
  
  const { selectedCompany, fetchCompanyById, isLoadingCompanies } = useClientStore();
  
  useEffect(() => {
    fetchCompanyById(companyId);
  }, [companyId, fetchCompanyById]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href={`/companies/${companyId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Company
          </Link>
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
