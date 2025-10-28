import { Link } from "wouter";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-muted-foreground">{t("notFound.title")}</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{t("notFound.heading")}</h2>
          <p className="text-muted-foreground">
            {t("notFound.description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Home className="w-4 h-4" />
            {t("notFound.backToDashboard")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
