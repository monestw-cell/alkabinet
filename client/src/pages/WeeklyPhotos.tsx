import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Image, Upload, Heart, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function WeeklyPhotos() {
  const [, setLocation] = useLocation();
  const [photoUrl, setPhotoUrl] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentWeek = Math.ceil((new Date().getDate()) / 7);
  const currentYear = new Date().getFullYear();

  const photosQuery = trpc.photos.getWeekly.useQuery({
    week: currentWeek,
    year: currentYear,
  });
  const uploadMutation = trpc.photos.uploadWeekly.useMutation();
  const voteMutation = trpc.photos.vote.useMutation();

  useEffect(() => {
    if (photosQuery.data) {
      setPhotos(photosQuery.data);
    }
  }, [photosQuery.data]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl.trim()) {
      toast.error("يرجى إدخال رابط الصورة");
      return;
    }

    setIsLoading(true);
    try {
      await uploadMutation.mutateAsync({
        photoUrl,
        week: currentWeek,
        year: currentYear,
      });

      toast.success("تم رفع الصورة بنجاح");
      setPhotoUrl("");
      photosQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في رفع الصورة");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (photoId: number) => {
    try {
      await voteMutation.mutateAsync({ photoId });
      toast.success("تم التصويت بنجاح");
      photosQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
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
              <Image className="w-8 h-8 text-orange-400" />
              أفضل صورة الأسبوع
            </h1>
            <p className="text-slate-400 text-sm mt-1">الأسبوع {currentWeek} من سنة {currentYear}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload Form */}
          <Card className="lg:col-span-1 border-slate-700 h-fit">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">رفع صورة</h2>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Photo URL Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">رابط الصورة</label>
                  <Input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="أدخل رابط الصورة"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !photoUrl.trim()}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      جاري الرفع...
                    </span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 ml-2" />
                      رفع الصورة
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Photos Gallery */}
          <div className="lg:col-span-3">
            <Card className="border-slate-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">الصور المرفوعة</h2>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {photos.map((photo: any) => (
                      <div
                        key={photo.id}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors"
                      >
                        {/* Photo Image */}
                        <div className="aspect-square bg-slate-900 overflow-hidden">
                          <img
                            src={photo.photoUrl}
                            alt="Weekly photo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23374151' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239CA3AF' font-size='24'%3Eصورة غير متاحة%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>

                        {/* Photo Info */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-orange-400">
                              <Heart className="w-5 h-5" />
                              <span className="font-semibold">{photo.votes} صوت</span>
                            </div>
                            {photo.isWinner && (
                              <span className="text-xs font-bold bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded">
                                🏆 الفائز
                              </span>
                            )}
                          </div>

                          <Button
                            onClick={() => handleVote(photo.id)}
                            disabled={photo.isWinner}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Heart className="w-4 h-4 ml-2" />
                            صوّت
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Image className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-500">لا توجد صور مرفوعة هذا الأسبوع</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
