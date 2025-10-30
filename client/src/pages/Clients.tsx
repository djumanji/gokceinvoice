import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Users as UsersIcon, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/ClientCard";
import { EmptyState } from "@/components/EmptyState";
import { OnboardingProgressBanner } from "@/components/OnboardingProgressBanner";
import { safeParseFloat } from "@/lib/numberUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  clientId: string;
  name: string;
  description?: string | null;
  projectNumber?: string | null;
  createdAt?: string | Date;
  isActive: boolean;
}

export default function Clients() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    address: "",
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch projects for editing client
  const { data: clientProjects = [] } = useQuery<Project[]>({
    queryKey: editingClient ? [`/api/clients/${editingClient.id}/projects`] : [""],
    queryFn: async () => {
      if (!editingClient) return [];
      return await apiRequest("GET", `/api/clients/${editingClient.id}/projects`);
    },
    enabled: !!editingClient,
  });

  useEffect(() => {
    if (editingClient && clientProjects && clientProjects.length > 0) {
      // Only update if projects actually changed (compare by IDs to avoid infinite loop)
      const currentProjectIds = projects.map(p => p.id).sort().join(',');
      const newProjectIds = clientProjects.map(p => p.id).sort().join(',');
      
      if (currentProjectIds !== newProjectIds) {
        setProjects(clientProjects);
      }
    } else if (!editingClient || !clientProjects || clientProjects.length === 0) {
      // Only clear if we're not editing or projects are empty
      if (projects.length > 0) {
        setProjects([]);
      }
    }
  }, [editingClient?.id, clientProjects]); // Use editingClient.id instead of editingClient object

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/clients", data),
    onSuccess: async (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      // Create projects if any were added
      if (projects.length > 0) {
        const projectPromises = projects
          .filter((p) => p.id.startsWith("temp-"))
          .map((project) =>
            apiRequest("POST", "/api/projects", {
              clientId: newClient.id,
              name: project.name,
              description: project.description || undefined,
            })
          );
        await Promise.all(projectPromises);
      }
      
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      apiRequest("PATCH", `/api/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      resetForm();
      setEditingClient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.refetchQueries({ queryKey: ["/api/clients"] });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: { clientId: string; name: string; description?: string }) =>
      apiRequest("POST", "/api/projects", data),
    onSuccess: async (newProject) => {
      if (editingClient) {
        // Invalidate and refetch projects query to update UI
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/clients/${editingClient.id}/projects`] 
        });
        await queryClient.refetchQueries({ 
          queryKey: [`/api/clients/${editingClient.id}/projects`] 
        });
      }
      setNewProject({ name: "", description: "" });
      toast({
        title: "Project Created",
        description: "Project has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: async () => {
      if (editingClient) {
        // Invalidate and refetch projects query to update UI
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/clients/${editingClient.id}/projects`] 
        });
        await queryClient.refetchQueries({ 
          queryKey: [`/api/clients/${editingClient.id}/projects`] 
        });
      }
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", company: "", phone: "", address: "" });
    setProjects([]);
    setNewProject({ name: "", description: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      company: client.company || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setIsDialogOpen(true);
  };

  const handleAddProject = () => {
    // Validate that project name is provided
    if (!newProject.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    if (!editingClient && !formData.name) {
      toast({
        title: "Error",
        description: "Please create the client first, then add projects",
        variant: "destructive",
      });
      return;
    }

    // Capture both name and description together
    const projectName = newProject.name.trim();
    const projectDescription = newProject.description?.trim() || undefined;

    // If editing existing client, create project immediately via API
    if (editingClient) {
      createProjectMutation.mutate({
        clientId: editingClient.id,
        name: projectName,
        description: projectDescription,
      });
    } else {
      // Store for later creation after client is created
      setProjects([
        ...projects,
        {
          id: `temp-${Date.now()}`,
          clientId: "",
          name: projectName,
          description: projectDescription || null,
          isActive: true,
        },
      ]);
      // Clear the form after adding
      setNewProject({ name: "", description: "" });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (projectId.startsWith("temp-")) {
      setProjects(projects.filter((p) => p.id !== projectId));
    } else {
      if (confirm("Are you sure you want to delete this project?")) {
        deleteProjectMutation.mutate(projectId);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t("clients.deleteConfirmation"))) {
      deleteMutation.mutate(id);
    }
  };

  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    const outstanding = clientInvoices
      .filter(inv => inv.status !== "paid")
      .reduce((sum, inv) => sum + safeParseFloat(inv.total, 0), 0);
    return {
      totalInvoices: clientInvoices.length,
      outstandingAmount: outstanding,
    };
  };

  return (
    <div className="p-6 space-y-6">
      <OnboardingProgressBanner currentStep="clients" />
      
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("clients.title")}</h1>
          <p className="text-muted-foreground">{t("clients.subtitle")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingClient(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client">
              <Plus className="w-4 h-4" />
              {t("clients.addClient")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? t("clients.editClient") : t("clients.addNewClient")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("clients.name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-client-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-client-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t("clients.company")}</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  data-testid="input-client-company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("client.phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-client-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("client.address")}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  data-testid="input-client-address"
                />
              </div>

              {/* Projects Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Projects</Label>
                </div>
                
                {/* Add Project Form */}
                <div className="space-y-2 p-3 bg-muted rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name *</Label>
                    <Input
                      id="project-name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="e.g., Website Redesign"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddProject();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Project description"
                      rows={2}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddProject}
                    disabled={createProjectMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Project
                  </Button>
                </div>

                {/* Projects List */}
                {projects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Existing Projects</Label>
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-md"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{project.name}</div>
                              {project.projectNumber && (
                                <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-0.5 rounded">
                                  {project.projectNumber}
                                </span>
                              )}
                            </div>
                            {project.description && (
                              <div className="text-sm text-muted-foreground">
                                {project.description}
                              </div>
                            )}
                            {project.createdAt && (
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(project.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProject(project.id)}
                            disabled={deleteProjectMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                    setEditingClient(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-client"
                >
                  {editingClient ? t("clients.update") : t("clients.create")} {t("client.client")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("clients.loadingClients")}</div>
      ) : clients.length === 0 ? (
        <div className="border rounded-lg p-12">
          <EmptyState
            icon={UsersIcon}
            title={t("clients.noClientsYet")}
            description={t("clients.addFirstClient")}
            actionLabel={t("clients.addClient")}
            onAction={() => setIsDialogOpen(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const stats = getClientStats(client.id);
            return (
              <ClientCard
                key={client.id}
                id={client.id}
                name={client.name}
                email={client.email}
                phone={client.phone || undefined}
                totalInvoices={stats.totalInvoices}
                outstandingAmount={stats.outstandingAmount}
                onEdit={() => handleEdit(client)}
                onDelete={(id) => handleDelete(id)}
                onViewInvoices={(id) => console.log("View invoices for client:", id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
