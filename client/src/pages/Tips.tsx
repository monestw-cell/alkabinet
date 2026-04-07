import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lightbulb, Plus, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Tips() {
  const [, setLocation] = useLocation();
  const [content, setContent] = useState("");
  const [tips, setTips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const tipsQuery = trpc.tips.getAll.useQuery();
  const createMutation = trpc.tips.create.useMutation();

  useEffect(() => {
    if (tipsQuery.data) {
      setTips(tipsQuery.data);
    }
  }, [tipsQuery.data]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("يرجى كتابة النصيحة");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({ content });

      toast.success("تم إرسال النصيحة بنجاح");
      setContent("");
      tipsQuery.refetch();
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
              <Lightbulb className="w-8 h-8 text-cyan-400" />
              صندوق النصائح
            </h1>
            <p className="text-slate-400 text-sm mt-1">أرسل نصائح مجهولة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Tip Form */}
          <Card className="lg:col-span-1 border-slate-700 h-fit">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">أرسل نصيحة</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Content Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">النصيحة</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="اكتب النصيحة..."
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !content.trim()}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري الإرسال...
                    </span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      إرسال النصيحة
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Tips List */}
          <Card className="lg:col-span-2 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">النصائح المرسلة</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {tips.length > 0 ? (
                  tips.map((tip: any) => (
                    <div
                      key={tip.id}
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-semibold text-cyan-400">💡 نصيحة</span>
                        <span className="text-xs text-slate-500">
                          {new Date(tip.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>

                      <p className="text-slate-100 leading-relaxed">
                        {tip.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-500">لا توجد نصائح حتى الآن</p>
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
