import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { EMAIL_CONFIG } from "@/config/email";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  { value: "general", label: "Allmän fråga", email: EMAIL_CONFIG.MAIN.primary },
  {
    value: "support",
    label: "Teknisk support",
    email: EMAIL_CONFIG.SUPPORT.technical,
  },
  {
    value: "safety",
    label: "Säkerhetsrapport",
    email: EMAIL_CONFIG.SUPPORT.safety,
  },
  {
    value: "privacy",
    label: "Integritetsfråga",
    email: EMAIL_CONFIG.LEGAL.privacy,
  },
  {
    value: "business",
    label: "Affärssamarbete",
    email: EMAIL_CONFIG.BUSINESS.partnerships,
  },
] as const;

type CategoryValue = (typeof categories)[number]["value"];

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general" as CategoryValue,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulera API-anrop (ersätt med riktig endpoint när backend finns)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSuccess(true);
    setIsSubmitting(false);
    setFormData({ name: "", email: "", category: "general", message: "" });
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const selectedCategory = categories.find((c) => c.value === formData.category);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Skicka meddelande</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Namn</Label>
            <Input
              id="contact-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ditt namn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Din e-post</Label>
            <Input
              id="contact-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="din@epost.se"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-category">Kategori</Label>
            <Select
              value={formData.category}
              onValueChange={(value: CategoryValue) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger id="contact-category">
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label} ({cat.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">Meddelande</Label>
            <Textarea
              id="contact-message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Skriv ditt meddelande..."
              className="resize-none"
            />
          </div>

          {isSuccess && (
            <div className="rounded-lg bg-primary/10 p-4 text-sm text-primary">
              Tack för ditt meddelande! Vi återkommer inom 24 timmar.
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Skickar...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Skicka meddelande
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ditt meddelande skickas till:{" "}
            {selectedCategory?.email ?? EMAIL_CONFIG.MAIN.primary}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
