import { Mail, Shield, HelpCircle, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMAIL_CONFIG } from "@/config/email";

const contactCategories = [
  {
    title: "Allmänna frågor",
    icon: Mail,
    emails: [
      { label: "Huvudkontakt", address: EMAIL_CONFIG.MAIN.primary },
      { label: "Administratör", address: EMAIL_CONFIG.MAIN.admin },
    ],
  },
  {
    title: "Support & Säkerhet",
    icon: HelpCircle,
    emails: [
      { label: "Teknisk support", address: EMAIL_CONFIG.SUPPORT.technical },
      { label: "Säkerhetsrapporter", address: EMAIL_CONFIG.SUPPORT.safety },
    ],
  },
  {
    title: "Juridik & Integritet",
    icon: Shield,
    emails: [
      { label: "Dataskyddsombud", address: EMAIL_CONFIG.LEGAL.privacy },
      { label: "Juridiska frågor", address: EMAIL_CONFIG.LEGAL.legal },
    ],
  },
  {
    title: "Affär & Partnerskap",
    icon: Briefcase,
    emails: [
      { label: "Affärssamarbeten", address: EMAIL_CONFIG.BUSINESS.partnerships },
    ],
  },
];

export function ContactInfo() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {contactCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-medium">
                    {category.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.emails.map((email, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-primary/20 pl-3"
                  >
                    <p className="text-xs text-muted-foreground">
                      {email.label}
                    </p>
                    <a
                      href={`mailto:${email.address}`}
                      className="text-sm font-medium text-primary hover:underline break-all"
                    >
                      {email.address}
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            <strong>Obs:</strong> För akuta säkerhetsärenden, använd alltid{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              safety@maakapp.se
            </code>
            . Vi återkommer inom 24 timmar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
