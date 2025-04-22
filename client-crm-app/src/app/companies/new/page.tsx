"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/components/company-form";
import { ArrowLeft } from "lucide-react";

export default function NewCompanyPage() {
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
      
      <CompanyForm />
    </div>
  );
}
