import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Image, Upload, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const imagesQuery = trpc.gallery.getAll.useQuery();
  const uploadMutation = trpc.gallery.upload.useMutation();

  useEffect(() => {
    if (imagesQuery.data) {
      setImages(imagesQuery.data);
    }
  }, [imagesQuery.data]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl.trim()) {
      toast.error("يرجى إدخال رابط الصورة");
      return;
    }

    setIsLoading(true);
    try {
      await uploadMutation.mutateAsync({ imageUrl });

      toast.success("تم رفع الصورة بنجاح");
      setImageUrl("");
      imagesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في رفع الصورة");
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
              <Image className="w-8 h-8 text-violet-400" />
              أرشيف الصور
            </h1>
            <p className="text-slate-400 text-sm mt-1">معرض صور المجموعة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload Form */}
          <Card className="lg:col-span-1 border-slate-700 h-fit">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">رفع صورة</h2>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Image URL Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">رابط الصورة</label>
                  <Input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="أدخل رابط الصورة"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !imageUrl.trim()}
                  className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white"
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

          {/* Gallery Grid */}
          <div className="lg:col-span-3">
            {images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image: any) => (
                  <Card key={image.id} className="border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
                    <div className="aspect-square bg-slate-900 overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt="Gallery image"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23374151' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239CA3AF' font-size='24'%3Eصورة غير متاحة%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>

                    <div className="p-3 bg-slate-800/50">
                      <p className="text-xs text-slate-500">
                        {new Date(image.createdAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-slate-700">
                <div className="p-12 text-center">
                  <Image className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-slate-500">لا توجد صور في الأرشيف</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
