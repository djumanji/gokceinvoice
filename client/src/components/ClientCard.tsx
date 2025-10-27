import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Pencil, FileText, Trash2 } from "lucide-react";

interface ClientCardProps {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalInvoices: number;
  outstandingAmount: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewInvoices?: (id: string) => void;
}

export function ClientCard({
  id,
  name,
  email,
  phone,
  totalInvoices,
  outstandingAmount,
  onEdit,
  onDelete,
  onViewInvoices,
}: ClientCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card data-testid={`card-client-${id}`} className="hover-elevate">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(id)}
            data-testid={`button-edit-client-${id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(id)}
            data-testid={`button-delete-client-${id}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">{email}</span>
          </div>
          {phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{phone}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-lg font-semibold" data-testid={`text-total-invoices-${id}`}>
              {totalInvoices}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-lg font-semibold font-mono" data-testid={`text-outstanding-${id}`}>
              ${outstandingAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewInvoices?.(id)}
          data-testid={`button-view-invoices-${id}`}
        >
          <FileText className="w-4 h-4" />
          View Invoices
        </Button>
      </CardContent>
    </Card>
  );
}
