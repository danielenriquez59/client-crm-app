"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompanyDetail } from "@/components/company-detail";
import { ArrowLeft } from "lucide-react";
import { use } from "react";

interface CompanyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CompanyPage({ params }: CompanyPageProps) {
  // Unwrap params using React.use() to avoid the warning
  const unwrappedParams = use(params);
  const companyId = parseInt(unwrappedParams.id, 10);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Link>
        </Button>
      </div>
      
      <CompanyDetail companyId={companyId} />
    </div>
  );
}
