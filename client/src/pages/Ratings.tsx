
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Star, Plus, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Ratings() {
  const [, setLocation] = useLocation();
  const [ratedUserId, setRatedUserId] = useState("");
  const [rating, setRating] = useState("5");
  const [users, setUsers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const usersQuery = trpc.auth.getAllUsers.useQuery();
  const createMutation = trpc.ratings.create.useMutation();

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data.filter((u: any) => u.isProfileComplete));
    }
  }, [usersQuery.data]);



  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ratedUserId) {
      toast.error("يرجى اختيار الشخص");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        ratedUserId: parseInt(ratedUserId),
        rating: parseInt(rating),
      });

      toast.success("تم التقييم بنجاح");
      setRatedUserId("");
      setRating("5");
      
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  const getAverageRating = (userId: number) => {
    const userRatings = ratings.filter((r: any) => r.ratedUserId === userId);
    if (userRatings.length === 0) return 0;
    const sum = userRatings.reduce((acc: number, r: any) => acc + r.rating, 0);
    return (sum / userRatings.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
              <Star className="w-8 h-8 text-pink-400" />
              دفتر التقييم
            </h1>
            <p className="text-slate-400 text-sm mt-1">قيّم الأعضاء وشوف تقييمك</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rate Form */}
          <Card className="lg:col-span-1 border-slate-700 h-fit">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">إضافة تقييم</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* User Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الشخص</label>
                  <Select value={ratedUserId} onValueChange={setRatedUserId}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="اختر الشخص" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()} className="text-slate-100">
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">التقييم</label>
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <SelectItem key={r} value={r.toString()} className="text-slate-100">
                          {"⭐".repeat(r)} ({r})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !ratedUserId}
                  className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري التقييم...
                    </span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة التقييم
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Ratings Summary */}
          <Card className="lg:col-span-2 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">متوسط التقييمات</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => {
                  const avgRating = getAverageRating(user.id);
                  const userRatingCount = ratings.filter((r: any) => r.ratedUserId === user.id).length;

                  return (
                    <div
                      key={user.id}
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-100 mb-2">
                        {user.fullName}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-pink-400">
                          {avgRating}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i <= Math.round(parseFloat(avgRating))
                                  ? "fill-pink-400 text-pink-400"
                                  : "text-slate-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">
                          ({userRatingCount} تقييم)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
