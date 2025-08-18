import { TrendingUp } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border bg-gradient-to-r from-background via-card to-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/30">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                flux
              </h1>
              <p className="text-sm text-muted-foreground">AI Stock Prediction</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-bullish rounded-full animate-pulse"></div>
            Market Open
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;