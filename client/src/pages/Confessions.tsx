import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageCircle, Send, ArrowRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Confessions() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesQuery = trpc.confessions.getMessages.useQuery();
  const sendMutation = trpc.confessions.send.useMutation();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("يرجى كتابة الرسالة");
      return;
    }

    setIsLoading(true);
    try {
      await sendMutation.mutateAsync({
        message,
      });

      toast.success("تم إرسال الرسالة بنجاح");
      setMessage("");
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
            <p className="text-slate-400 text-sm mt-1">الحنيوك - شات جماعي مجهول معاد صياغة بالفصحى</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Messages Display */}
          <Card className="border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">الرسائل</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messagesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                  messagesQuery.data.map((msg: any) => (
                    <div
                      key={msg.id}
                      className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-colors"
                    >
                      <p className="text-slate-300 leading-relaxed">{msg.reformattedMessage}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(msg.createdAt).toLocaleString("ar-SA")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">لا توجد رسائل حتى الآن</p>
                )}
              </div>
            </div>
          </Card>

          {/* Send Message Form */}
          <Card className="border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">أرسل رسالة مجهولة</h2>
              <form onSubmit={handleSend} className="space-y-4">
                <Textarea
                  placeholder="اكتب رسالتك هنا... سيتم إعادة صياغتها بالفصحى تلقائياً"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-24 bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      إرسال
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
