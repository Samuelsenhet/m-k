import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useProfileData } from '@/hooks/useProfileData';
import { ButtonPrimary, ButtonIcon } from '@/components/ui-v2';
import { ChevronLeft, Mail } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import AdminEmailDashboard from '@/components/admin/email/AdminEmailDashboard';

export default function AdminEmail() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isModerator } = useProfileData(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
      return;
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isModerator === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
        <p className="text-muted-foreground text-center mb-4">Du har inte behörighet till denna sida.</p>
        <ButtonPrimary asChild>
          <Link to="/profile">Tillbaka</Link>
        </ButtonPrimary>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <ButtonIcon asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </ButtonIcon>
          <h1 className="font-serif text-lg font-bold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            E-posthantering
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <AdminEmailDashboard />
      </div>

      <BottomNav />
    </div>
  );
}
