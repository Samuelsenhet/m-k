import { useState } from "react";
import { MaakMascot, Pose, Expression } from "./MaakMascot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export const MascotController = () => {
  const [pose, setPose] = useState<Pose>("idle");
  const [expression, setExpression] = useState<Expression>("😊");

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <Card className="p-6 bg-gradient-to-br from-pink-50 to-purple-50">
        <MaakMascot size={300} pose={pose} expression={expression} />
      </Card>

      <div className="flex gap-4 flex-wrap justify-center">
        {/* Pose Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Pose</label>
          <Select value={pose} onValueChange={(v) => setPose(v as Pose)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Välj pose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="idle">Idle (Vila)</SelectItem>
              <SelectItem value="jump">Jump (Hoppa)</SelectItem>
              <SelectItem value="fall">Fall (Falla)</SelectItem>
              <SelectItem value="bounce">Bounce (Studsa)</SelectItem>
              <SelectItem value="startled">Startled (Skrämd)</SelectItem>
              <SelectItem value="love">Love (Kärlek)</SelectItem>
              <SelectItem value="tired">Tired (Trött)</SelectItem>
              <SelectItem value="confused">Confused (Förvirrad)</SelectItem>
              <SelectItem value="happy">Happy (Glad)</SelectItem>
              <SelectItem value="angry">Angry (Arg)</SelectItem>
              <SelectItem value="asleep">Asleep (Sover)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expression Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Expression</label>
          <Select value={expression} onValueChange={(v) => setExpression(v as Expression)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Välj uttryck" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="😊">😊 Glad</SelectItem>
              <SelectItem value="😴">😴 Trött</SelectItem>
              <SelectItem value="😵‍💫">😵‍💫 Förvirrad</SelectItem>
              <SelectItem value="😍">😍 Kärlek</SelectItem>
              <SelectItem value="😡">😡 Arg</SelectItem>
              <SelectItem value="😐">😐 Neutral</SelectItem>
              <SelectItem value="🤗">🤗 Kram</SelectItem>
              <SelectItem value="😮">😮 Förvånad</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => { setPose("love"); setExpression("😍"); }}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          💕 Kärlek
        </button>
        <button
          onClick={() => { setPose("asleep"); setExpression("😴"); }}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          😴 Sover
        </button>
        <button
          onClick={() => { setPose("startled"); setExpression("😮"); }}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          😮 Förvånad
        </button>
        <button
          onClick={() => { setPose("jump"); setExpression("😊"); }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          🎉 Hoppar av glädje
        </button>
      </div>

      {/* Current state display */}
      <div className="text-sm text-gray-600 text-center">
        <p>Aktuell pose: <span className="font-semibold">{pose}</span></p>
        <p>Aktuellt uttryck: <span className="font-semibold text-xl">{expression}</span></p>
      </div>
    </div>
  );
};

export default MascotController;
