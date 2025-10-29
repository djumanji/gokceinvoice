import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SendLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  shareableUrl: string;
}

export function SendLinkModal({
  isOpen,
  onClose,
  clientEmail,
  clientName,
  invoiceNumber,
  total,
  shareableUrl,
}: SendLinkModalProps) {
  const [customMessage, setCustomMessage] = useState("");
  const { toast } = useToast();

  const generateMessage = () => {
    const baseMessage = `Hi ${clientName},

Please view your invoice here: ${shareableUrl}

${customMessage ? customMessage + "\n\n" : ""}Invoice #: ${invoiceNumber}
Total: €${total.toFixed(2)}`;

    return baseMessage;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateMessage());
      toast({
        title: "Link copied!",
        description: "Paste into your email client to send to the client.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Invoice Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Recipient Email</Label>
            <Input value={clientEmail} disabled />
          </div>
          <div>
            <Label>Custom Message (Optional)</Label>
            <Textarea
              placeholder="Add a personal note..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Preview:</Label>
            <Card className="p-4 bg-muted">
              <pre className="text-sm whitespace-pre-wrap">
                {generateMessage()}
              </pre>
            </Card>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
