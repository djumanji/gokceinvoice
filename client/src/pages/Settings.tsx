import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

const profileSchema = z.object({
  name: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxOfficeId: z.string().optional(),
  preferredCurrency: z.enum(["USD", "EUR", "GBP", "AUD", "TRY"]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current user profile
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      return res.json();
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      companyName: "",
      address: "",
      phone: "",
      taxOfficeId: "",
      preferredCurrency: "USD",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        companyName: user.companyName || "",
        address: user.address || "",
        phone: user.phone || "",
        taxOfficeId: user.taxOfficeId || "",
        preferredCurrency: user.preferredCurrency || "USD",
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PATCH", "/api/users/profile", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      form.reset({
        name: user.name || "",
        companyName: user.companyName || "",
        address: user.address || "",
        phone: user.phone || "",
        taxOfficeId: user.taxOfficeId || "",
        preferredCurrency: user.preferredCurrency || "USD",
      });
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

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profileInformation")}</CardTitle>
          <CardDescription>
            {t("settings.profileDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("settings.namePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.companyName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("settings.companyNamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.address")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("settings.addressPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("settings.phonePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxOfficeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.taxRegistrationNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("settings.taxRegistrationNumberPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.preferredCurrency")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("settings.selectCurrency")} />
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
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t("common.loading") : t("common.save")}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
