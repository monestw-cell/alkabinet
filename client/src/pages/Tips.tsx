import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lightbulb, Send, ArrowRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Tips() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [recipientId, setRecipientId] = useState("");
  const [content, setContent] = useState("");
  const [receivedTips, setReceivedTips] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const usersQuery = trpc.auth.getAllUsers.useQuery();
  const tipsQuery = trpc.tips.getForUser.useQuery();
  const createMutation = trpc.tips.create.useMutation();

  useEffect(() => {
    if (usersQuery.data) {
      // Filter out current user
      const filtered = usersQuery.data.filter((u: any) => u.id !== user?.id);
      setUsers(filtered);
    }
  }, [usersQuery.data, user?.id]);

  useEffect(() => {
    if (tipsQuery.data) {
      setReceivedTips(tipsQuery.data);
    }
  }, [tipsQuery.data]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientId) {
      toast.error("يرجى اختيار المستقبل");
      return;
    }

    if (!content.trim()) {
      toast.error("يرجى كتابة النصيحة");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        recipientId: parseInt(recipientId),
        content,
      });

      toast.success("تم إرسال النصيحة بنجاح");
      setRecipientId("");
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
              <Lightbulb className="w-8 h-8 text-yellow-400" />
              صندوق النصائح
            </h1>
            <p className="text-slate-400 text-sm mt-1">أرسل نصائح شخصية لأصدقائك</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Send Tip Form */}
          <Card className="border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">أرسل نصيحة</h2>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    اختر المستقبل
                  </label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                      <SelectValue placeholder="اختر الشخص المراد نصحه" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 max-w-xs">
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()} className="text-slate-100">
                          <span className="truncate">{u.fullName || u.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    النصيحة
                  </label>
                  <Textarea
                    placeholder="اكتب نصيحتك هنا..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-24 bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !recipientId || !content.trim()}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      إرسال النصيحة
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Received Tips */}
          <Card className="border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">النصائح المستقبلة</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {tipsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                  </div>
                ) : receivedTips && receivedTips.length > 0 ? (
                  receivedTips.map((tip: any) => (
                    <div
                      key={tip.id}
                      className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-yellow-500 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {tip.senderProfileImage && (
                          <img
                            src={tip.senderProfileImage}
                            alt={tip.senderName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="text-slate-300 font-medium">{tip.senderName}</p>
                          <p className="text-slate-500 text-xs">
                            {new Date(tip.createdAt).toLocaleString("ar-SA")}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{tip.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">لا توجد نصائح حتى الآن</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
