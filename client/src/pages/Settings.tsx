import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Trash2, Edit } from "lucide-react";

const profileSchema = z.object({
  name: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxOfficeId: z.string().optional(),
});

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

type ProfileFormData = z.infer<typeof profileSchema>;
type BankAccountFormData = z.infer<typeof bankAccountSchema>;

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "TRY", label: "TRY - Turkish Lira" },
];

export default function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  // Fetch current user profile
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      return res;
    },
  });

  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["/api/bank-accounts"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/bank-accounts");
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      companyName: "",
      address: "",
      phone: "",
      taxOfficeId: "",
    },
  });

  const bankForm = useForm<BankAccountFormData>({
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

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        companyName: user.companyName || "",
        address: user.address || "",
        phone: user.phone || "",
        taxOfficeId: user.taxOfficeId || "",
      });
    }
  }, [user, profileForm]);

  useEffect(() => {
    if (editingBankId && bankAccounts) {
      const bank = bankAccounts.find((b: any) => b.id === editingBankId);
      if (bank) {
        bankForm.reset({
          accountHolderName: bank.accountHolderName || "",
          bankName: bank.bankName || "",
          accountNumber: bank.accountNumber || "",
          iban: bank.iban || "",
          swiftCode: bank.swiftCode || "",
          bankAddress: bank.bankAddress || "",
          bankBranch: bank.bankBranch || "",
          currency: bank.currency || "USD",
          isDefault: bank.isDefault || false,
        });
      }
    }
  }, [editingBankId, bankAccounts, bankForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PATCH", "/api/users/profile", data);
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: t("common.success"),
        description: t("settings.profileUpdated"),
      });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
      toast({
        title: t("common.error"),
        description: t("settings.profileUpdateFailed"),
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const createBankMutation = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      return await apiRequest("POST", "/api/bank-accounts", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: t("common.success"),
        description: "Bank account added successfully",
      });
      setIsAddingBank(false);
      setEditingBankId(null);
      bankForm.reset();
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BankAccountFormData }) => {
      return await apiRequest("PATCH", `/api/bank-accounts/${id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: t("common.success"),
        description: "Bank account updated successfully",
      });
      setIsAddingBank(false);
      setEditingBankId(null);
      bankForm.reset();
    },
  });

  const deleteBankMutation = useMutation({
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

  const setDefaultBankMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/bank-accounts/${id}/set-default`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: t("common.success"),
        description: "Default bank account updated",
      });
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    updateProfileMutation.mutate(data);
  };

  const onBankSubmit = async (data: BankAccountFormData) => {
    if (editingBankId) {
      updateBankMutation.mutate({ id: editingBankId, data });
    } else {
      createBankMutation.mutate(data);
    }
  };

  const handleEditBank = (id: string) => {
    setEditingBankId(id);
    setIsAddingBank(true);
  };

  const handleDeleteBank = (id: string) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      deleteBankMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.settings")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("settings.description")}
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.profileInformation")}</CardTitle>
              <CardDescription>{t("settings.profileDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("settings.namePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.companyName")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("settings.companyNamePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.address")}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t("settings.addressPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.phone")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("settings.phonePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="taxOfficeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.taxRegistrationNumber")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("settings.taxRegistrationNumberPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? t("common.loading") : t("common.save")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bank Accounts</CardTitle>
                  <CardDescription>Manage your bank accounts for invoice payments</CardDescription>
                </div>
                {!isAddingBank && (
                  <Button onClick={() => setIsAddingBank(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bank Account
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isAddingBank && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">
                    {editingBankId ? "Edit Bank Account" : "Add Bank Account"}
                  </h3>
                  <Form {...bankForm}>
                    <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-4">
                      <FormField
                        control={bankForm.control}
                        name="accountHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Holder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter account holder name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bankForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter bank name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bankForm.control}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IBAN</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter IBAN" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bankForm.control}
                        name="swiftCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SWIFT Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter SWIFT code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bankForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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

                      <div className="flex gap-2">
                        <Button type="submit">Save</Button>
                        <Button type="button" variant="outline" onClick={() => {
                          setIsAddingBank(false);
                          setEditingBankId(null);
                          bankForm.reset();
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              {bankAccounts.length === 0 && !isAddingBank ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bank accounts added yet. Click "Add Bank Account" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {bankAccounts.map((bank: any) => (
                    <div key={bank.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-semibold">{bank.bankName}</div>
                          <div className="text-sm text-muted-foreground">{bank.accountHolderName}</div>
                          {bank.currency && <div className="text-sm">Currency: {bank.currency}</div>}
                          {bank.isDefault && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBank(bank.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBank(bank.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {!bank.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultBankMutation.mutate(bank.id)}
                            >
                              Set Default
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

