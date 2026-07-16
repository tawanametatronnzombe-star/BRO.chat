import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber pointer-events-none opacity-20"></div>
      
      <Card className="w-full max-w-md mx-4 glass-card border-destructive/20 relative z-10 neon-glow">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-4 items-center">
            <div className="p-3 bg-destructive/10 rounded-xl neon-glow">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              404 // NOT_FOUND
            </h1>
          </div>

          <p className="mt-4 text-base text-muted-foreground">
            You've entered dead space. This sector doesn't exist.
          </p>
          <a 
            href="/"
            className="mt-6 inline-flex w-full items-center justify-center h-11 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Return to Base
          </a>
        </CardContent>
      </Card>
    </div>
  );
}