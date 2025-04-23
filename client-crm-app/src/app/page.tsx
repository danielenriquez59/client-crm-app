"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientList } from "@/components/client-list";
import { RecentInteractions } from "@/components/recent-interactions";
import { UserPlus, Users, Calendar, BarChart, MessageSquarePlus, Building, Plus } from "lucide-react";
import { useClientStore } from "@/lib/stores";
import { InteractionModal } from "@/components/interaction-modal";
import { CompanyList } from "@/components/company-list";
import { CompanyModal } from "@/components/company-modal";
import { ClientModal } from "@/components/client-modal";
import { Interaction } from "@/lib/db";

export default function Home() {
  const { 
    fetchRecentClients, 
    clients, 
    isLoading, 
    error, 
    fetchAllInteractions, 
    interactions,
    fetchCompanies,
    companies
  } = useClientStore();
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [currentInteraction, setCurrentInteraction] = useState<Interaction | undefined>(undefined);
  const [interactionMode, setInteractionMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    fetchRecentClients();
    fetchAllInteractions();
    fetchCompanies();
  }, [fetchRecentClients, fetchAllInteractions, fetchCompanies]);

  const stats = {
    total: clients.length,
    new: clients.filter(client => {
      const createdAt = new Date(client.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt >= thirtyDaysAgo;
    }).length,
    interactions: interactions.length,
    companies: companies.length,
    newCompanies: companies.filter(company => {
      const createdAt = new Date(company.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt >= thirtyDaysAgo;
    }).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="grid gap-2 grid-cols-3">
          <Button onClick={() => setInteractionModalOpen(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Add Interaction
          </Button>
          <Button onClick={() => setClientModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
          <Button  onClick={() => setCompanyModalOpen(true)}>
            <Building className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.newCompanies} new in last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interactions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Recent Interactions</h3>
          <Button variant="outline" size="sm" asChild>
            <Link href="/interactions">View All</Link>
          </Button>
        </div>
        <RecentInteractions 
          limit={5} 
          onEdit={(interaction: Interaction) => {
            setCurrentInteraction(interaction);
            setInteractionMode('edit');
            setInteractionModalOpen(true);
          }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Recent Clients</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href="/clients">View All</Link>
            </Button>
          </div>
          <ClientList limit={10} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Companies</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href="/companies">View All</Link>
            </Button>
          </div>
          <CompanyList limit={10} />
        </div>
      </div>

      {/* Modals */}
      <InteractionModal 
        isOpen={interactionModalOpen} 
        onClose={() => {
          setInteractionModalOpen(false);
          setCurrentInteraction(undefined);
          setInteractionMode('create');
        }} 
        interaction={currentInteraction}
        mode={interactionMode}
      />
      
      <CompanyModal 
        isOpen={companyModalOpen} 
        onClose={() => setCompanyModalOpen(false)} 
      />
      
      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
      />
    </div>
  );
}
