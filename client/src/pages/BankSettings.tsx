import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";

const bankAccountSchema = z.object({
  accountHolderName: z.string().min(1, "Account holder name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  bankAddress: z.string().optional(),
  bankBranch: z.string().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "AUD", "TRY"]).default("USD"),
  isDefault: z.boolean().default(false),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "TRY", label: "TRY - Turkish Lira" },
];

export default function BankSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch bank accounts
  const { data: bankAccounts = [], isLoading } = useQuery({
    queryKey: ["/api/bank-accounts"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/bank-accounts");
    },
  });

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      iban: "",
      swiftCode: "",
      bankAddress: "",
      bankBranch: "",
      currency: "USD",
      isDefault: false,
    },
  });

  const createBankAccountMutation = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      return await apiRequest("POST", "/api/bank-accounts", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: t("common.success"),
        description: "Bank account added successfully",
      });
      setIsAdding(false);
      setEditingId(null);
      form.reset();
    },
  });

  const updateBankAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BankAccountFormData }) => {
      return await apiRequest("PATCH", `/api/bank-accounts/${id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: t("common.success"),
        description: "Bank account updated successfully",
      });
      setEditingId(null);
      form.reset();
    },
  });

  const deleteBankAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/bank-accounts/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: t("common.success"),
        description: "Bank account deleted successfully",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/bank-accounts/${id}/set-default`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKeyционно ["/api/bank-accounts"] });
      toast({
        title: t("common.success"),
        description: "Default bank account updated",
      });
    },
  });

  const onSubmit = (data: BankAccountFormData) => {
    if (editingId !== null) {
      updateBankAccountMutation.mutate({ id: editingId, data });
    } else {
      createBankAccountMutation.mutate(data);
    }
  };

  const handleEdit = (account: any) => {
    setEditingId(account.id);
    form.reset(account);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      deleteBankAccountMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Progress />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.bankDetails")}</h1>
        <p className="text-muted-foreground mt-2">
          Manage your bank accounts for invoice payments
        </p>
      </div>

      {!isAdding && (
        <div className="mb-4">
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        </div>
      )}

      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Bank Account" : "Add Bank Account"}</CardTitle>
            <CardDescription>
              Enter the details for your bank account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.accountHolderName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("settings.accountHolderNamePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.bankName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("settings.bankNamePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.iban")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("settings.ibanPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="swiftCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.swiftCode")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("settings.swiftCodePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.accountNumber")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("settings.accountNumberPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.bankBranch")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("settings.bankBranchPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.bankAddress")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("settings.bankAddressPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={createBankAccountMutation.isPending}>
                    {editingId ? t("common.save") : "Add Account"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {bankAccounts.length === 0 && !isAdding && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No bank accounts added yet. Click "Add Bank Account" to get started.
            </CardContent>
          </Card>
        )}

        {bankAccounts.map((account: any) => (
          <Card key={account.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{account.bankName}</h3>
                    {account.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{account.accountHolderName}</p>
                  {account.iban && <p className="text-sm">IBAN: {account.iban}</p>}
                  {account.swiftCode && <p className="text-sm">SWIFT: {account.swiftCode}</p>}
                  {account.currency && <p className="text-sm">Currency: {account.currency}</p>}
                </div>
                <div className="flex gap-2">
                  {!account.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(account.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(account)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

