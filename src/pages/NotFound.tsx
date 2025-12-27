import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import mascotThinking from "@/assets/mascot-thinking.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero p-4">
      <div className="text-center max-w-md">
        <img 
          src={mascotThinking} 
          alt="MÄÄK mascot confused" 
          className="w-40 h-40 mx-auto mb-6 animate-float drop-shadow-xl"
        />
        <h1 className="mb-2 text-6xl font-serif font-bold text-foreground">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">
          Hoppsan! Den här sidan finns inte.
        </p>
        <Button asChild className="gradient-primary text-primary-foreground border-0 shadow-glow">
          <Link to="/">Tillbaka till start</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
