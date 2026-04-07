import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Upload, User, Calendar, BookOpen, Smile, ArrowRight, Loader2 } from "lucide-react";

export default function EditProfile() {
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

  const userQuery = trpc.auth.me.useQuery();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  useEffect(() => {
    if (userQuery.data && userQuery.data.fullName) {
      setFormData({
        fullName: userQuery.data.fullName || "",
        dateOfBirth: userQuery.data.dateOfBirth ? new Date(userQuery.data.dateOfBirth).toISOString().split('T')[0] : "",
        specialization: userQuery.data.specialization || "",
        hobbies: userQuery.data.hobbies || "",
        profileImage: userQuery.data.profileImage || "",
      });
      setImagePreview(userQuery.data.profileImage || "");
    }
  }, [userQuery.data]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      !formData.specialization ||
      !formData.hobbies
    ) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        fullName: formData.fullName,
        dateOfBirth: new Date(formData.dateOfBirth),
        profileImage: formData.profileImage,
        specialization: formData.specialization,
        hobbies: formData.hobbies,
      });

      toast.success("تم تحديث الملف الشخصي بنجاح");
      setLocation("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ في تحديث الملف الشخصي");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
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
              <User className="w-8 h-8 text-blue-400" />
              تعديل الملف الشخصي
            </h1>
            <p className="text-slate-400 text-sm mt-1">حدّث معلوماتك الشخصية</p>
          </div>
        </div>

        <Card className="border-slate-700">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  الصورة الشخصية
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-20 h-20 rounded-lg object-cover border border-slate-600"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:cursor-pointer"
                  />
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
                  className="bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
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
                  className="bg-slate-800 border-slate-600 text-slate-100"
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
                  placeholder="أدخل تخصصك"
                  className="bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
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
                  placeholder="أدخل هواياتك (مفصولة بفواصل)"
                  className="bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
