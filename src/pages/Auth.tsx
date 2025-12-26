import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Auth page now redirects to phone auth - phone is the only registration method
export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    } else {
      // Redirect to phone auth as it's the only registration method
      navigate('/phone-auth', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Laddar...</div>
    </div>
  );
}
