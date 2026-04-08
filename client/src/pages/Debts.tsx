import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, Plus, Check, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Debts() {
  const [, setLocation] = useLocation();
  const [debtorId, setDebtorId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const usersQuery = trpc.auth.getAllUsers.useQuery();
  const debtsQuery = trpc.debts.getAll.useQuery();
  const createMutation = trpc.debts.create.useMutation();
  const markPaidMutation = trpc.debts.markAsPaid.useMutation();

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data.filter((u: any) => u.isProfileComplete));
    }
  }, [usersQuery.data]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!debtorId || !amount || parseFloat(amount) <= 0) {
      toast.error("يرجى ملء جميع الحقول بشكل صحيح");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        creditorId: user?.id || 0,
        debtorId: parseInt(debtorId),
        amount: parseFloat(amount),
        reason: reason || "",
      });

      toast.success("تم تسجيل الدين بنجاح");
      setDebtorId("");
      setAmount("");
      setReason("");
      debtsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في تسجيل الدين");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (debtId: number) => {
    try {
      await markPaidMutation.mutateAsync({ debtId });
      toast.success("تم تسجيل السداد");
      debtsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const unpaidDebts = debtsQuery.data?.filter((d: any) => !d.isPaid) || [];
  const paidDebts = debtsQuery.data?.filter((d: any) => d.isPaid) || [];

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
              <DollarSign className="w-8 h-8 text-green-400" />
              سجل الديون
            </h1>
            <p className="text-slate-400 text-sm mt-1">تتبع الديون بين الأصدقاء</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Debt Form */}
          <Card className="lg:col-span-1 border-slate-700 h-fit">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">إضافة دين</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Debtor Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">المدين</label>
                  <Select value={debtorId} onValueChange={setDebtorId}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="اختر المدين" />
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

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">المبلغ</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="أدخل المبلغ"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {/* Reason Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">السبب (اختياري)</label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="مثال: غداء، تذاكر سينما"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !debtorId || !amount}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري الإضافة...
                    </span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة دين
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Debts List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unpaid Debts */}
            <Card className="border-slate-700">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-100 mb-4">الديون المتبقية</h2>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {unpaidDebts.length > 0 ? (
                    unpaidDebts.map((debt: any) => (
                      <div
                        key={debt.id}
                        className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-100">
                              {users.find((u) => u.id === debt.debtorId)?.fullName || "شخص ما"}
                            </p>
                            <p className="text-lg font-bold text-green-400 mt-1">{debt.amount} ريال</p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(debt.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                        </div>

                        {debt.reason && (
                          <p className="text-sm text-slate-400 mb-3">السبب: {debt.reason}</p>
                        )}

                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(debt.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Check className="w-4 h-4 ml-1" />
                          تم السداد
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-500">لا توجد ديون متبقية</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Paid Debts */}
            {paidDebts.length > 0 && (
              <Card className="border-slate-700">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-100 mb-4">الديون المسددة</h2>

                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {paidDebts.map((debt: any) => (
                      <div
                        key={debt.id}
                        className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-400">
                              {users.find((u) => u.id === debt.debtorId)?.fullName || "شخص ما"}
                            </p>
                            <p className="text-sm font-semibold text-slate-500">{debt.amount} ريال</p>
                          </div>
                          <span className="text-xs text-green-500">✓ مسدد</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
