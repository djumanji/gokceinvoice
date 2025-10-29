import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceCreated: (service: { id: string; name: string; price: string }) => void;
}

export function ServiceDialog({ isOpen, onClose, onServiceCreated }: ServiceDialogProps) {
  const { toast } = useToast();
  const [serviceData, setServiceData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    unit: "item",
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/services", data),
    onSuccess: async (newService) => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["/api/services"] });
        await queryClient.refetchQueries({ queryKey: ["/api/services"] });
        
        onServiceCreated(newService);
        setServiceData({ name: "", description: "", category: "", price: "", unit: "item" });
        onClose();
        
        toast({
          title: "Service Created",
          description: `${newService.name} has been added successfully`,
        });
      } catch (error: any) {
        console.error("Error processing service creation:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to process service creation",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Failed to create service:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Service name is required",
        variant: "destructive",
      });
      return;
    }

    if (!serviceData.price || isNaN(parseFloat(serviceData.price)) || parseFloat(serviceData.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "A valid price greater than 0 is required",
        variant: "destructive",
      });
      return;
    }

    createServiceMutation.mutate({
      name: serviceData.name.trim(),
      description: serviceData.description?.trim() || undefined,
      category: serviceData.category?.trim() || undefined,
      price: parseFloat(serviceData.price),
      unit: serviceData.unit,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Service Name *</Label>
            <Input
              value={serviceData.name}
              onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
              required
              placeholder="e.g., Web Development"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={serviceData.description}
              onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
              placeholder="Service description"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={serviceData.category}
              onChange={(e) => setServiceData({ ...serviceData, category: e.target.value })}
              placeholder="e.g., Development, Consulting"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={serviceData.price}
                onChange={(e) => setServiceData({ ...serviceData, price: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={serviceData.unit}
                onValueChange={(value) => setServiceData({ ...serviceData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item">Item</SelectItem>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createServiceMutation.isPending}>
              {createServiceMutation.isPending ? "Adding..." : "Add Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

