import { useState } from "react";
import { Plus, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/ClientCard";
import { EmptyState } from "@/components/EmptyState";

export default function Clients() {
  const [hasClients] = useState(true); // todo: remove mock functionality

  // todo: remove mock functionality
  const mockClients = [
    {
      id: "1",
      name: "Acme Corporation",
      email: "contact@acme.com",
      phone: "+1 (555) 123-4567",
      totalInvoices: 12,
      outstandingAmount: 3200.0,
    },
    {
      id: "2",
      name: "TechStart Inc",
      email: "hello@techstart.io",
      phone: "+1 (555) 987-6543",
      totalInvoices: 8,
      outstandingAmount: 1500.5,
    },
    {
      id: "3",
      name: "Design Studio",
      email: "info@designstudio.com",
      totalInvoices: 5,
      outstandingAmount: 0,
    },
    {
      id: "4",
      name: "Global Solutions",
      email: "support@globalsolutions.com",
      phone: "+1 (555) 456-7890",
      totalInvoices: 15,
      outstandingAmount: 4200.0,
    },
    {
      id: "5",
      name: "Startup Labs",
      email: "team@startuplabs.io",
      phone: "+1 (555) 321-0987",
      totalInvoices: 6,
      outstandingAmount: 1750.0,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client information and relationships</p>
        </div>
        <Button onClick={() => console.log("Add client")} data-testid="button-add-client">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {hasClients ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockClients.map((client) => (
            <ClientCard
              key={client.id}
              {...client}
              onEdit={(id) => console.log("Edit client:", id)}
              onViewInvoices={(id) => console.log("View invoices for client:", id)}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-12">
          <EmptyState
            icon={UsersIcon}
            title="No clients yet"
            description="Add your first client to start creating invoices and tracking payments."
            actionLabel="Add Client"
            onAction={() => console.log("Add client")}
          />
        </div>
      )}
    </div>
  );
}
