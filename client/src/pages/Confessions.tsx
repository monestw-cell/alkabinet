import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageCircle, Send, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Confessions() {
  const [, setLocation] = useLocation();
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const usersQuery = trpc.auth.getAllUsers.useQuery();
  const messagesQuery = trpc.confessions.getMessages.useQuery();
  const sendMutation = trpc.confessions.send.useMutation();

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data.filter((u: any) => u.isProfileComplete));
    }
  }, [usersQuery.data]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientId || !message.trim()) {
      toast.error("يرجى اختيار المستقبل وكتابة الرسالة");
      return;
    }

    setIsLoading(true);
    try {
      await sendMutation.mutateAsync({
        recipientId: parseInt(recipientId),
        message,
      });

      toast.success("تم إرسال الرسالة بنجاح");
      setMessage("");
      setRecipientId("");
      messagesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في إرسال الرسالة");
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
              <MessageCircle className="w-8 h-8 text-blue-400" />
              شات الاعتراف السري
            </h1>
            <p className="text-slate-400 text-sm mt-1">الحنيوك - أرسل رسائل مجهولة معاد صياغتها بالفصحى</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Message Form */}
          <Card className="lg:col-span-1 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">أرسل رسالة</h2>

              <form onSubmit={handleSend} className="space-y-4">
                {/* Recipient Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">المستقبل</label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="اختر المستقبل" />
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

                {/* Message Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الرسالة</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-slate-500">
                    سيتم إعادة صياغة رسالتك بالفصحى تلقائياً
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !recipientId || !message.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري الإرسال...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      إرسال
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Messages List */}
          <Card className="lg:col-span-2 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">الرسائل المستقبلة</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messagesQuery.data && messagesQuery.data.length > 0 ? (
                  messagesQuery.data.map((msg: any) => (
                    <div
                      key={msg.id}
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-400">الحنيوك</span>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>

                      <p className="text-slate-100 mb-2 leading-relaxed">
                        {msg.arabicMessage}
                      </p>

                      {msg.originalMessage !== msg.arabicMessage && (
                        <details className="text-xs text-slate-500 cursor-pointer">
                          <summary>الرسالة الأصلية</summary>
                          <p className="mt-2 p-2 bg-slate-900/50 rounded text-slate-400">
                            {msg.originalMessage}
                          </p>
                        </details>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-500">لا توجد رسائل حتى الآن</p>
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
