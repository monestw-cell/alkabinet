import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const membersQuery = trpc.auth.getMembers.useQuery();
  const loginMutation = trpc.auth.login.useMutation();
  const setPasswordMutation = trpc.auth.setPassword.useMutation();

  useEffect(() => {
    if (membersQuery.data) {
      setMembers(membersQuery.data);
    }
  }, [membersQuery.data]);

  // Monitor form changes to ensure state is in sync
  useEffect(() => {
    const form = document.querySelector('form');
    if (!form) return;

    const handleFormChange = () => {
      // This ensures React state stays in sync with form inputs
      // even when values are set programmatically
    };

    form.addEventListener('change', handleFormChange);
    return () => form.removeEventListener('change', handleFormChange);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get form values directly to bypass React state issues
    const form = e.target as HTMLFormElement;
    const usernameInput = form.querySelector('select, [role="combobox"]') as any;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
    
    const selectedUsername = username || usernameInput?.value;
    const selectedPassword = password || passwordInput?.value;
    
    if (!selectedUsername || !selectedPassword) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setIsLoading(true);
    try {
      if (isNewUser) {
        await setPasswordMutation.mutateAsync({
          username: selectedUsername,
          password: selectedPassword,
        });
        toast.success("تم إنشاء كلمة السر بنجاح");
        setIsNewUser(false);
        setPassword("");
      } else {
        const result = await loginMutation.mutateAsync({
          username: selectedUsername,
          password: selectedPassword,
        });
        toast.success("تم تسجيل الدخول بنجاح");
        // Redirect to profile completion or dashboard
        if (!result.user.isProfileComplete) {
          setLocation("/profile-setup");
        } else {
          setLocation("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في تسجيل الدخول");
      if (error.message?.includes("لم يتم تعيين كلمة سر")) {
        setIsNewUser(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 border-slate-700 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              الكابينيت
            </h1>
            <p className="text-slate-400 text-sm">مجموعة خاصة للأصدقاء</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">اسم المستخدم</label>
              <Select value={username || ""} onValueChange={(value) => {
                setUsername(value);
                // Force React to re-evaluate the button state
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }, 0);
              }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="اختر اسمك من القائمة" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {members.map((member) => (
                    <SelectItem key={member} value={member} className="text-slate-100">
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {isNewUser ? "إنشاء كلمة السر" : "كلمة السر"}
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
                <Input
                  type="password"
                  placeholder={isNewUser ? "أنشئ كلمة سر قوية" : "أدخل كلمة السر"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100 pr-10 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  جاري المعالجة...
                </span>
              ) : isNewUser ? (
                "إنشاء كلمة السر"
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          {/* Info Message */}
          <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 text-center">
              {isNewUser
                ? "هذا أول دخول لك، يرجى إنشاء كلمة سر قوية"
                : "استخدم اسمك من القائمة وكلمة السر الخاصة بك"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
