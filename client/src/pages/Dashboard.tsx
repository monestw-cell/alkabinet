import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MessageCircle,
  Gift,
  Image,
  DollarSign,
  Laugh,
  Gamepad2,
  Star,
  Lightbulb,
  Heart,
  Bell,
  LogOut,
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);

  const notificationsQuery = trpc.notifications.getForUser.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await logout();
      toast.success("تم تسجيل الخروج بنجاح");
      setLocation("/login");
    } catch (error) {
      toast.error("حدث خطأ في تسجيل الخروج");
    }
  };

  const features: Feature[] = [
    {
      id: "confessions",
      title: "شات الاعتراف السري",
      description: "الحنيوك - أرسل رسائل مجهولة معاد صياغتها بالفصحى",
      icon: <MessageCircle className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
      path: "/confessions",
    },
    {
      id: "invitations",
      title: "حابب تعزم حد؟",
      description: "أرسل عزومة لأحد الأصدقاء",
      icon: <Gift className="w-8 h-8" />,
      color: "from-purple-500 to-pink-500",
      path: "/invitations",
    },
    {
      id: "photos",
      title: "أفضل صورة الأسبوع",
      description: "رفع صور والتصويت للأفضل",
      icon: <Image className="w-8 h-8" />,
      color: "from-orange-500 to-red-500",
      path: "/weekly-photos",
    },
    {
      id: "debts",
      title: "سجل الديون",
      description: "تتبع الديون بين الأصدقاء",
      icon: <DollarSign className="w-8 h-8" />,
      color: "from-green-500 to-emerald-500",
      path: "/debts",
    },
    {
      id: "moments",
      title: "المواقف المحرجة",
      description: "أرشيف المواقف المحرجة المضحكة",
      icon: <Laugh className="w-8 h-8" />,
      color: "from-yellow-500 to-orange-500",
      path: "/embarrassing-moments",
    },
    {
      id: "pes",
      title: "سجل البيس",
      description: "نتائج لعبة PES اليومية",
      icon: <Gamepad2 className="w-8 h-8" />,
      color: "from-indigo-500 to-purple-500",
      path: "/pes-results",
    },
    {
      id: "ratings",
      title: "دفتر التقييم",
      description: "قيّم الأصدقاء وشوف تقييمك",
      icon: <Star className="w-8 h-8" />,
      color: "from-pink-500 to-rose-500",
      path: "/ratings",
    },
    {
      id: "tips",
      title: "صندوق النصائح",
      description: "أرسل نصائح مجهولة",
      icon: <Lightbulb className="w-8 h-8" />,
      color: "from-cyan-500 to-blue-500",
      path: "/tips",
    },
    {
      id: "gallery",
      title: "أرشيف الصور",
      description: "معرض صور المجموعة",
      icon: <Image className="w-8 h-8" />,
      color: "from-violet-500 to-purple-500",
      path: "/gallery",
    },
    {
      id: "charity",
      title: "الصدقة الجارية",
      description: "صدقة جارية عن روح محمد جمعة",
      icon: <Heart className="w-8 h-8" />,
      color: "from-red-500 to-pink-500",
      path: "/charity",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              الكابينيت
            </h1>
            <p className="text-slate-400 text-sm">أهلاً {user?.fullName}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-300 hover:text-white"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </div>

            {/* Logout */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">مرحباً بك في الكابينيت</h2>
          <p className="text-slate-400">اختر ميزة للبدء</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className="border-slate-700 hover:border-slate-600 transition-all duration-300 cursor-pointer group overflow-hidden"
              onClick={() => setLocation(feature.path)}
            >
              <div className="p-6 relative">
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                ></div>

                {/* Content */}
                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-2.5 mb-4 text-white group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-blue-400">→</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
