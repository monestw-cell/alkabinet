import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Upload, User, Calendar, BookOpen, Smile } from "lucide-react";

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    specialization: "",
    hobbies: "",
    profileImage: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const completeProfileMutation = trpc.auth.completeProfile.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll use a data URL. In production, upload to S3
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setFormData((prev) => ({ ...prev, profileImage: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.dateOfBirth ||
      !formData.profileImage ||
      !formData.specialization ||
      !formData.hobbies
    ) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setIsLoading(true);
    try {
      await completeProfileMutation.mutateAsync({
        fullName: formData.fullName,
        dateOfBirth: new Date(formData.dateOfBirth),
        profileImage: formData.profileImage,
        specialization: formData.specialization,
        hobbies: formData.hobbies,
      });

      toast.success("تم إكمال الملف الشخصي بنجاح");
      setLocation("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في إكمال الملف الشخصي");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-slate-700 shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-100 mb-2">إكمال الملف الشخصي</h1>
              <p className="text-slate-400">أخبرنا عن نفسك</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">الصورة الشخصية</label>
                <div className="flex gap-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-slate-600"
                    />
                  )}
                  <label className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-sm text-slate-400">اضغط لرفع صورة</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  الاسم الكامل
                </label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="أدخل اسمك الكامل"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  تاريخ الميلاد
                </label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              {/* Specialization */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  التخصص الدراسي
                </label>
                <Input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="مثال: هندسة البرمجيات"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              {/* Hobbies */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  الهوايات
                </label>
                <Textarea
                  name="hobbies"
                  value={formData.hobbies}
                  onChange={handleInputChange}
                  placeholder="اكتب هواياتك (مثال: البرمجة، الرياضة، القراءة)"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    جاري الحفظ...
                  </span>
                ) : (
                  "إكمال الملف الشخصي"
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
