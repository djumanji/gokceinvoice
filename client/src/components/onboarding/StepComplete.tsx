import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Receipt, ArrowRight } from "lucide-react";

interface StepCompleteProps {
  onNavigate: (path: string) => void;
}

export function StepComplete({ onNavigate }: StepCompleteProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">You're All Set!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Your account is ready. What would you like to do first?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Invoice Card */}
            <Card
              className="cursor-pointer hover:border-primary transition-colors group"
              onClick={() => onNavigate('/invoices/new')}
            >
              <CardContent className="pt-6 text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Create Invoice</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate your first professional invoice for your client
                  </p>
                </div>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Create Invoice
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Add Expense Card */}
            <Card
              className="cursor-pointer hover:border-primary transition-colors group"
              onClick={() => onNavigate('/expenses')}
            >
              <CardContent className="pt-6 text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Receipt className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Add Expense</h3>
                  <p className="text-sm text-muted-foreground">
                    Start tracking your business expenses for better insights
                  </p>
                </div>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Add Expense
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-4">
            <Button
              variant="link"
              onClick={() => onNavigate('/')}
              className="text-muted-foreground hover:text-primary"
            >
              Or explore your dashboard →
            </Button>
          </div>

          <div className="border-t pt-6 mt-6">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Quick Tips:</p>
              <ul className="space-y-1 text-left max-w-md mx-auto">
                <li>• You can add more clients anytime from the Clients page</li>
                <li>• Create services/products for faster invoicing</li>
                <li>• Track expenses with receipts for tax time</li>
                <li>• Customize your profile in Settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
