import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Gift, Send, Check, X, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Invitations() {
  const [, setLocation] = useLocation();
  const [inviteeId, setInviteeId] = useState("");
  const [invitationType, setInvitationType] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const usersQuery = trpc.auth.getAllUsers.useQuery();
  const invitationsQuery = trpc.invitations.getInvitations.useQuery();
  const createMutation = trpc.invitations.create.useMutation();
  const respondMutation = trpc.invitations.respond.useMutation();

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data.filter((u: any) => u.isProfileComplete));
    }
  }, [usersQuery.data]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteeId || !invitationType.trim()) {
      toast.error("يرجى اختيار الشخص ونوع العزومة");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        inviteeId: parseInt(inviteeId),
        invitationType,
      });

      toast.success("تم إرسال العزومة بنجاح");
      setInviteeId("");
      setInvitationType("");
      invitationsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في إرسال العزومة");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (invitationId: number, status: "accepted" | "declined") => {
    try {
      await respondMutation.mutateAsync({
        invitationId,
        status,
      });

      toast.success(status === "accepted" ? "تم قبول العزومة" : "تم رفض العزومة");
      invitationsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
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
              <Gift className="w-8 h-8 text-purple-400" />
              حابب تعزم حد؟
            </h1>
            <p className="text-slate-400 text-sm mt-1">أرسل عزومة لأحد الأصدقاء</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Invitation Form */}
          <Card className="lg:col-span-1 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">أرسل عزومة</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Invitee Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">من تريد أن تعزم؟</label>
                  <Select value={inviteeId} onValueChange={setInviteeId}>
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

                {/* Invitation Type Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">نوع العزومة</label>
                  <Input
                    type="text"
                    value={invitationType}
                    onChange={(e) => setInvitationType(e.target.value)}
                    placeholder="مثال: غداء، عشاء، لعبة، حفلة"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !inviteeId || !invitationType.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري الإرسال...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      إرسال العزومة
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Invitations List */}
          <Card className="lg:col-span-2 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">العزومات المستقبلة</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {invitationsQuery.data && invitationsQuery.data.length > 0 ? (
                  invitationsQuery.data.map((invitation: any) => (
                    <div
                      key={invitation.id}
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-purple-400">
                            {users.find((u) => u.id === invitation.inviterId)?.fullName || "شخص ما"}
                          </p>
                          <p className="text-slate-100 font-medium mt-1">
                            {invitation.invitationType}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(invitation.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>

                      {invitation.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRespond(invitation.id, "accepted")}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 ml-1" />
                            قبول
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRespond(invitation.id, "declined")}
                            variant="outline"
                            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                          >
                            <X className="w-4 h-4 ml-1" />
                            رفض
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              invitation.status === "accepted"
                                ? "bg-green-900/30 text-green-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {invitation.status === "accepted" ? "✓ مقبولة" : "✗ مرفوضة"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-500">لا توجد عزومات حتى الآن</p>
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
