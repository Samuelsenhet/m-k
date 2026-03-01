import { useState } from "react";
import { Mascot } from "@/components/system/Mascot";
import { MASCOT_ASSET_NAMES, type MascotToken } from "@/lib/mascot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardV2 } from "@/components/ui-v2";

/** Demo: pick a mascot token and see the asset. Replaces pose/expression with token-based system. */
export const MascotController = () => {
  const [token, setToken] = useState<MascotToken>(MASCOT_ASSET_NAMES[0]);

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <CardV2 padding="lg" className="bg-gradient-to-br from-primary/5 to-primary/10">
        <Mascot token={token} size="hero" placement="center" />
      </CardV2>

      <div className="flex gap-4 flex-wrap justify-center">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Mascot token</label>
          <Select value={token} onValueChange={(v) => setToken(v as MascotToken)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Välj token" />
            </SelectTrigger>
            <SelectContent>
              {MASCOT_ASSET_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  {name.replace("mascot_", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        <p>
          Token: <span className="font-mono font-semibold">{token}</span>
        </p>
      </div>
    </div>
  );
};

export default MascotController;
