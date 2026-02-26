import { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ButtonPrimary, CardV2, CardV2Content, CardV2Footer, CardV2Header, CardV2Title, InputV2 } from '@/components/ui-v2';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'You have been logged in.',
      });
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <CardV2 className="w-full max-w-md">
        <CardV2Header>
          <CardV2Title>Login</CardV2Title>
          <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
        </CardV2Header>
        <form onSubmit={handleSubmit}>
          <CardV2Content className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <InputV2
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <InputV2
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardV2Content>
          <CardV2Footer className="flex flex-col space-y-4">
            <ButtonPrimary type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </ButtonPrimary>
            <div className="text-sm text-center space-y-2">
              <div>
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </div>
          </CardV2Footer>
        </form>
      </CardV2>
    </div>
  );
}