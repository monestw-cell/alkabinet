import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Laugh, Plus, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function EmbarrassingMoments() {
  const [, setLocation] = useLocation();
  const [description, setDescription] = useState("");
  const [moments, setMoments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const momentsQuery = trpc.moments.getAll.useQuery();
  const createMutation = trpc.moments.create.useMutation();

  useEffect(() => {
    if (momentsQuery.data) {
      setMoments(momentsQuery.data);
    }
  }, [momentsQuery.data]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("يرجى كتابة الموقف");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({ description });

      toast.success("تم إضافة الموقف بنجاح");
      setDescription("");
      momentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
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
              <Laugh className="w-8 h-8 text-yellow-400" />
              المواقف المحرجة
            </h1>
            <p className="text-slate-400 text-sm mt-1">أرشيف المواقف المحرجة المضحكة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Moment Form */}
          <Card className="lg:col-span-1 border-slate-700 h-fit">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">إضافة موقف</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Description Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الموقف</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب الموقف المحرج..."
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !description.trim()}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري الإضافة...
                    </span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة الموقف
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Moments List */}
          <Card className="lg:col-span-2 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">الأرشيف</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {moments.length > 0 ? (
                  moments.map((moment: any) => (
                    <div
                      key={moment.id}
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {moment.userProfileImage && (
                            <img
                              src={moment.userProfileImage}
                              alt={moment.userName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-600"
                            />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-yellow-400">
                              {moment.userName}
                            </p>
                            <span className="text-xs text-slate-500">
                              {new Date(moment.createdAt).toLocaleDateString("ar-SA")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-100 leading-relaxed">
                        {moment.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Laugh className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-500">لا توجد مواقف محرجة حتى الآن</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
