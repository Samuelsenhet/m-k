import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { ButtonPrimary, CardV2, CardV2Content } from '@/components/ui-v2';
import { Slider } from '@/components/ui/slider';
import { COLORS } from '@/design/tokens';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { useTranslation } from 'react-i18next';
import { getProfilesAuthKey } from '@/lib/profiles';
import { toast } from 'sonner';

interface MatchingPreferences {
  min_age: number;
  max_age: number;
  max_distance: number;
}

const AGE_MIN = 20;
const AGE_MAX = 70;
const DISTANCE_MIN = 5;
const DISTANCE_MAX = 200;

export function MatchingSettings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    min_age: AGE_MIN,
    max_age: 38,
    max_distance: 40,
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    const profileKey = await getProfilesAuthKey(user.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('min_age, max_age, max_distance')
      .eq(profileKey, user.id)
      .maybeSingle();

    if (data && !error) {
      const rawMin = Number(data.min_age);
      const rawMax = Number(data.max_age);
      const rawDist = Number(data.max_distance);
      setPreferences({
        min_age: Math.max(Number.isNaN(rawMin) || rawMin < AGE_MIN ? AGE_MIN : rawMin, AGE_MIN),
        max_age: Math.min(Number.isNaN(rawMax) ? 38 : rawMax, AGE_MAX),
        max_distance: Math.min(Math.max(Number.isNaN(rawDist) ? 40 : rawDist, DISTANCE_MIN), DISTANCE_MAX),
      });
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    const profileKey = await getProfilesAuthKey(user.id);
    const minAge = Math.max(preferences.min_age, AGE_MIN);
    const { error } = await supabase
      .from('profiles')
      .update({
        min_age: minAge,
        max_age: preferences.max_age,
        max_distance: preferences.max_distance,
      })
      .eq(profileKey, user.id);

    setLoading(false);

    if (error) {
      toast.error(t('profile.error_saving', 'Kunde inte spara'));
    } else {
      toast.success(t('settings.matching_settings') + ' – ' + t('common.save_changes'));
      setHasChanges(false);
    }
  };

  const updatePreference = <K extends keyof MatchingPreferences>(
    key: K,
    value: MatchingPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <CardV2>
      <CardV2Content className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: COLORS.sage[100] }}
        >
          <Users className="w-5 h-5" style={{ color: COLORS.primary[600] }} />
        </div>
        <h3 className="text-base font-semibold text-foreground">{t('settings.matching_settings')}</h3>
      </div>
      {/* Age – label left, value right, range slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{t('settings.age')}</span>
          <span className="text-sm font-semibold text-foreground">
            {Math.max(preferences.min_age, AGE_MIN)}–{preferences.max_age}
          </span>
        </div>
        <Slider
          value={[Math.max(preferences.min_age, AGE_MIN), preferences.max_age]}
          onValueChange={([min, max]) => {
            if (min != null && max != null && min <= max) {
              updatePreference('min_age', Math.max(min, AGE_MIN));
              updatePreference('max_age', max);
            }
          }}
          min={AGE_MIN}
          max={AGE_MAX}
          step={1}
          className="w-full"
        />
      </div>

      {/* Distance – label left, value right, single slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{t('settings.distance')}</span>
          <span className="text-sm font-semibold text-foreground">{preferences.max_distance} km</span>
        </div>
        <Slider
          value={[preferences.max_distance]}
          onValueChange={([value]) => value != null && updatePreference('max_distance', value)}
          min={DISTANCE_MIN}
          max={DISTANCE_MAX}
          step={5}
          className="w-full"
        />
      </div>

      {/* Submit button – full width, rounded, primary green */}
      <ButtonPrimary
        onClick={handleSave}
        disabled={loading || !hasChanges}
        className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 shadow-sm"
        size="lg"
      >
        {loading ? t('common.saving') : t('settings.submit')}
      </ButtonPrimary>
    </CardV2Content>
    </CardV2>
  );
}
