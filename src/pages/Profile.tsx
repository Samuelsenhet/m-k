import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, Settings, Sparkles, X } from 'lucide-react';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { BottomNav } from '@/components/navigation/BottomNav';
import { toast } from 'sonner';

interface PersonalityResultRow {
  id: string;
  archetype?: string;
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [archetype, setArchetype] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchArchetype();
    }
  }, [user]);

  const fetchArchetype = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('personality_results')
      .select('id, archetype')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.archetype) {
      setArchetype(data.archetype);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Du har loggat ut');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <nav className="flex justify-between items-center mb-4">
          <h1 className="font-serif font-bold text-lg">Min profil</h1>
          <div className="flex items-center gap-1">
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-serif">Inställningar</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Konto</CardTitle>
                      <CardDescription className="text-sm">{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm">Notifikationer</span>
                        <Button variant="ghost" size="sm">Hantera</Button>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm">Integritet</span>
                        <Button variant="ghost" size="sm">Hantera</Button>
                      </div>
                      <Link to="/" className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Gör personlighetstest
                        </span>
                        <Button variant="ghost" size="sm">Starta</Button>
                      </Link>
                    </CardContent>
                  </Card>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logga ut
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        {/* Profile Content */}
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-xl">Redigera profil</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ProfileEditor onComplete={() => setIsEditing(false)} />
          </div>
        ) : (
          <ProfileView 
            onEdit={() => setIsEditing(true)} 
            archetype={archetype}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
