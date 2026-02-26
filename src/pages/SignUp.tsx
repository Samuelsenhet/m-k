import { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ButtonPrimary, CardV2, CardV2Content, CardV2Footer, CardV2Header, CardV2Title, InputV2 } from '@/components/ui-v2';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, {
      full_name: fullName,
    });

    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Please check your email to verify your account.',
      });
      navigate('/login');
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <CardV2 className="w-full max-w-md">
        <CardV2Header>
          <CardV2Title>Sign Up</CardV2Title>
          <p className="text-sm text-muted-foreground">Create a new account to get started</p>
        </CardV2Header>
        <form onSubmit={handleSubmit}>
          <CardV2Content className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <InputV2
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <InputV2
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </CardV2Content>
          <CardV2Footer className="flex flex-col space-y-4">
            <ButtonPrimary type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </ButtonPrimary>
            <div className="text-sm text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </CardV2Footer>
        </form>
      </CardV2>
    </div>
  );
}