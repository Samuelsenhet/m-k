import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function DemoGroupChat() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/chat', { replace: true });
  }, [navigate]);
  return null;
}
