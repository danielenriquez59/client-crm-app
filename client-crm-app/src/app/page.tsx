"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientList } from "@/components/client-list";
import { UserPlus, Users, Calendar, BarChart, MessageSquarePlus } from "lucide-react";
import { useClientStore } from "@/lib/store";
import { InteractionModal } from "@/components/interaction-modal";

export default function Home() {
  const { fetchRecentClients, clients, isLoading, error } = useClientStore();
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);

  useEffect(() => {
    fetchRecentClients(5);
  }, [fetchRecentClients]);

  const stats = {
    total: clients.length,
    active: clients.filter(client => client.status === 'active').length,
    new: clients.filter(client => {
      const createdAt = new Date(client.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt >= thirtyDaysAgo;
    }).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setInteractionModalOpen(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Add Interaction
          </Button>
          <Button asChild>
            <Link href="/clients/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Client
            </Link>
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
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Clients (30d)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Recent Clients</h3>
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients">View All</Link>
          </Button>
        </div>
        <ClientList limit={5} />
      </div>

      <InteractionModal 
        isOpen={interactionModalOpen} 
        onClose={() => setInteractionModalOpen(false)} 
      />
    </div>
  );
}
