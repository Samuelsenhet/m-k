import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Calendar, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MatchingPreferences {
  min_age: number;
  max_age: number;
  max_distance: number;
}

export function MatchingSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    min_age: 20,
    max_age: 50,
    max_distance: 50,
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('min_age, max_age, max_distance')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setPreferences({
        min_age: Math.max(data.min_age || 20, 20),
        max_age: data.max_age || 50,
        max_distance: data.max_distance || 50,
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        min_age: preferences.min_age,
        max_age: preferences.max_age,
        max_distance: preferences.max_distance,
      })
      .eq('user_id', user.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte spara inställningar',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sparat!',
        description: 'Dina matchningsinställningar har uppdaterats',
      });
      setHasChanges(false);
    }
  };

  const updatePreference = <K extends keyof MatchingPreferences>(
    key: K,
    value: MatchingPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Matchningsinställningar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Åldersintervall</span>
            </div>
            <span className="font-medium">{preferences.min_age}-{preferences.max_age} år</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Max avstånd</span>
            </div>
            <span className="font-medium">{preferences.max_distance} km</span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Settings */}
      <Card className="bg-card">
        <CardContent className="pt-6 space-y-6">
          {/* Age Range */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Åldersintervall</h3>
              <span className="text-2xl font-bold text-primary">
                {preferences.min_age} - {preferences.max_age} år
              </span>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Min: {preferences.min_age}</span>
              <span>Max: {preferences.max_age}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Lägsta ålder</label>
                <Slider
                  value={[preferences.min_age]}
                  onValueChange={([value]) => {
                    if (value < preferences.max_age) {
                      updatePreference('min_age', value);
                    }
                  }}
                  min={20}
                  max={70}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Högsta ålder</label>
                <Slider
                  value={[preferences.max_age]}
                  onValueChange={([value]) => {
                    if (value > preferences.min_age) {
                      updatePreference('max_age', value);
                    }
                  }}
                  min={20}
                  max={70}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Max Distance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Max avstånd</h3>
              <span className="text-2xl font-bold text-primary">
                {preferences.max_distance} km
              </span>
            </div>

            <Slider
              value={[preferences.max_distance]}
              onValueChange={([value]) => updatePreference('max_distance', value)}
              min={5}
              max={200}
              step={5}
              className="w-full"
            />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Sparar...' : 'Slutför'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
