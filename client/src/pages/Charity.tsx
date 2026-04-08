import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Heart, Plus, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Charity() {
  const [, setLocation] = useLocation();
  const [type, setType] = useState<"dua" | "quran_verse">("dua");
  const [content, setContent] = useState("");
  const [arabicContent, setArabicContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const charityQuery = trpc.charity.getAll.useQuery();
  const createMutation = trpc.charity.create.useMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("يرجى كتابة المحتوى");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        type,
        content,
      });

      toast.success("تم إضافة الصدقة الجارية بنجاح");
      setContent("");
      setArabicContent("");
      setType("dua");
      charityQuery.refetch();
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
              <Heart className="w-8 h-8 text-red-400" />
              الصدقة الجارية
            </h1>
            <p className="text-slate-400 text-sm mt-1">صدقة جارية عن روح حبيبنا محمد جمعة المجايدة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Entry Form */}
          <Card className="lg:col-span-1 border-slate-700 h-fit">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">إضافة دعاء أو آية</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Type Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">النوع</label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="dua" className="text-slate-100">
                        دعاء
                      </SelectItem>
                      <SelectItem value="quran_verse" className="text-slate-100">
                        آية قرآنية
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">المحتوى</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={type === "dua" ? "اكتب الدعاء..." : "اكتب الآية القرآنية..."}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
                    rows={4}
                  />
                </div>

                {/* Arabic Content Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">المحتوى بالفصحى (اختياري)</label>
                  <Textarea
                    value={arabicContent}
                    onChange={(e) => setArabicContent(e.target.value)}
                    placeholder="إذا كان المحتوى بلهجة عامية"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !content.trim()}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري الإضافة...
                    </span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Charity Entries */}
          <Card className="lg:col-span-2 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">الأدعية والآيات</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {charityQuery.data && charityQuery.data.length > 0 ? (
                  charityQuery.data.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="text-2xl">
                          {entry.type === "dua" ? "🤲" : "📖"}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-400 uppercase">
                            {entry.type === "dua" ? "دعاء" : "آية قرآنية"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(entry.createdAt).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                      </div>

                      <p className="text-slate-100 leading-relaxed mb-2 text-sm">
                        {entry.arabicContent || entry.content}
                      </p>

                      {entry.arabicContent && entry.arabicContent !== entry.content && (
                        <details className="text-xs text-slate-500 cursor-pointer">
                          <summary>النسخة الأصلية</summary>
                          <p className="mt-2 p-2 bg-slate-900/50 rounded text-slate-400">
                            {entry.content}
                          </p>
                        </details>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-500">لا توجد أدعية أو آيات حتى الآن</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-slate-700 mt-6 bg-gradient-to-r from-red-900/20 to-pink-900/20">
          <div className="p-6">
            <p className="text-slate-300 text-center leading-relaxed">
              <span className="font-semibold text-red-400">محمد جمعة المجايدة</span> - رحمه الله وأسكنه فسيح جناته
              <br />
              <span className="text-sm text-slate-400 mt-2 block">
                كل دعاء وآية تضاف هنا صدقة جارية على روحه الطاهرة
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
