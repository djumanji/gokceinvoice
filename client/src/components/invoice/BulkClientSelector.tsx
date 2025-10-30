import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Client } from "@shared/schema";

interface BulkClientSelectorProps {
  clients: Client[];
  selectedClientIds: string[];
  onSelectionChange: (clientIds: string[]) => void;
}

export function BulkClientSelector({
  clients,
  selectedClientIds,
  onSelectionChange,
}: BulkClientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleClient = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      onSelectionChange(selectedClientIds.filter((id) => id !== clientId));
    } else {
      onSelectionChange([...selectedClientIds, clientId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedClientIds.length === filteredClients.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredClients.map((c) => c.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Clients</Label>
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredClients.length > 0 && (
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={
              filteredClients.length > 0 &&
              selectedClientIds.length === filteredClients.length
            }
            onCheckedChange={handleSelectAll}
          />
          <Label
            htmlFor="select-all"
            className="font-normal cursor-pointer"
          >
            Select All ({filteredClients.length})
          </Label>
        </div>
      )}

      <ScrollArea className="h-[300px] rounded-md border p-4">
        {filteredClients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {searchQuery ? "No clients found matching your search" : "No clients available"}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center space-x-2 py-2 hover:bg-muted/50 rounded px-2"
              >
                <Checkbox
                  id={`client-${client.id}`}
                  checked={selectedClientIds.includes(client.id)}
                  onCheckedChange={() => handleToggleClient(client.id)}
                />
                <Label
                  htmlFor={`client-${client.id}`}
                  className="font-normal cursor-pointer flex-1"
                >
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    {client.company && (
                      <span className="text-xs text-muted-foreground">
                        {client.company}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {client.email}
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {selectedClientIds.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedClientIds.length} client{selectedClientIds.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
