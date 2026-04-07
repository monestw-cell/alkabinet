import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Gamepad2, Plus, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function PESResults() {
  const [, setLocation] = useLocation();
  const [winnerId, setWinnerId] = useState("");
  const [loserId, setLoserId] = useState("");
  const [notPlayedId, setNotPlayedId] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const usersQuery = trpc.auth.getAllUsers.useQuery();
  const resultsQuery = trpc.pes.getResults.useQuery();
  const createMutation = trpc.pes.recordResult.useMutation();

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data.filter((u: any) => u.isProfileComplete));
    }
  }, [usersQuery.data]);

  useEffect(() => {
    if (resultsQuery.data) {
      setResults(resultsQuery.data);
    }
  }, [resultsQuery.data]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!winnerId || !loserId) {
      toast.error("يرجى اختيار الفائز والخاسر");
      return;
    }

    if (winnerId === loserId) {
      toast.error("لا يمكن أن يكون الفائز والخاسر نفس الشخص");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        winnerId: parseInt(winnerId),
        loserId: parseInt(loserId),
        notPlayedId: notPlayedId ? parseInt(notPlayedId) : undefined,
      });

      toast.success("تم تسجيل النتيجة بنجاح");
      setWinnerId("");
      setLoserId("");
      setNotPlayedId("");
      resultsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
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
              <Gamepad2 className="w-8 h-8 text-indigo-400" />
              سجل البيس
            </h1>
            <p className="text-slate-400 text-sm mt-1">نتائج لعبة PES اليومية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Record Result Form */}
          <Card className="lg:col-span-1 border-slate-700 h-fit">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">تسجيل النتيجة</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Winner Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الفائز</label>
                  <Select value={winnerId} onValueChange={setWinnerId}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="اختر الفائز" />
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

                {/* Loser Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الخاسر</label>
                  <Select value={loserId} onValueChange={setLoserId}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="اختر الخاسر" />
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

                {/* Not Played Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">من لم يلعب (اختياري)</label>
                  <Select value={notPlayedId} onValueChange={setNotPlayedId}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="اختر من لم يلعب" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="" className="text-slate-100">
                        لا أحد
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()} className="text-slate-100">
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !winnerId || !loserId}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري التسجيل...
                    </span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      تسجيل النتيجة
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Results List */}
          <Card className="lg:col-span-2 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">السجل</h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.length > 0 ? (
                  results.map((result: any) => (
                    <div
                      key={result.id}
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">
                          {new Date(result.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-400">
                            ✓ {users.find((u) => u.id === result.winnerId)?.fullName || "شخص ما"}
                          </p>
                        </div>

                        <div className="text-center px-4">
                          <span className="text-xs text-slate-500">vs</span>
                        </div>

                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold text-red-400">
                            ✗ {users.find((u) => u.id === result.loserId)?.fullName || "شخص ما"}
                          </p>
                        </div>
                      </div>

                      {result.notPlayedId && (
                        <p className="text-xs text-slate-400 mt-2">
                          لم يلعب: {users.find((u) => u.id === result.notPlayedId)?.fullName || "شخص ما"}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-500">لا توجد نتائج حتى الآن</p>
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
