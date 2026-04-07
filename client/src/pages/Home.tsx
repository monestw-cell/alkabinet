import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to login page
    setLocation("/login");
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
          الكابينيت
        </h1>
        <p className="text-slate-400 mb-8">جاري التوجيه...</p>
        <Button
          onClick={() => setLocation("/login")}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          اذهب إلى تسجيل الدخول
        </Button>
      </div>
    </div>
  );
}
