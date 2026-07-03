import { useState } from "react";
import { AuthModal } from "../components/auth/AuthModal";
import { BookOpen, Sparkles, Zap, Activity, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="bg-[#edfcec] text-[#4f6f52] overflow-x-hidden">
      <section
        id="gioithieu"
        className="relative pt-12 pb-24 md:pt-20 md:pb-36"
      >
        <div className="px-4 md:px-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
              <h1 className="font-extrabold text-4xl md:text-6xl leading-tight">
                Khởi đầu lối sống <br className="hidden md:block" />
                <span className="text-green-600">lành mạnh</span> ngay hôm nay
              </h1>
              <span className="inline-block py-1 text-green-700 italic font-semibold text-sm">
                "Tell me what you eat, and I will tell you who you are" -
                Anthelme Brillat-Savarin
              </span>
              <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto md:mx-0">
                Khám phá chế độ dinh dưỡng được cá nhân hóa dựa trên dữ liệu
                khoa học, giúp bạn đạt được mục tiêu sức khỏe một cách bền vững.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-[#006c49] hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                >
                  Bắt đầu ngay
                </button>
              </div>
            </div>

            <div className="w-full md:w-1/2 relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  alt="Healthy Food"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  src="../../src/assets/landingpage_food.jpg"
                />
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white shadow-xl p-4 rounded-2xl border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">
                    Bowl Ức gà Áp chảo
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    480 kcal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="py-16 bg-white border-y border-gray-100"
      >
        <div className="px-4 md:px-10 max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="font-extrabold text-3xl md:text-4xl text-gray-800">
              Công nghệ hỗ trợ sức khỏe
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Giải pháp thiết lập thực đơn dựa trên thể trạng cá
              nhân, giúp bạn dễ dàng duy trì lối sống lành mạnh mà không tốn
              thời gian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">
                Gợi ý thực đơn
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Hệ thống thực đơn được thiết kế riêng đa dạng và phù hợp với nhu
                cầu dinh dưỡng của bạn.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">
                Theo dõi dinh dưỡng
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Kiểm soát calo và dinh dưỡng thiết yếu để tối ưu hóa sự hấp thụ
                và duy trì thể trạng.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2">
                Linh hoạt theo mục tiêu
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Tự do khám phá và thay đổi món ăn hằng ngày giúp thực đơn của
                bạn luôn mới mẻ.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-20">
        <div className="px-4 md:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="bg-green-600 p-6 rounded-3xl text-white shadow-lg">
                  <div className="text-4xl md:text-5xl font-extrabold mb-1">
                    Đa dạng
                  </div>
                  <div className="text-sm font-semibold">
                    Thực đơn dinh dưỡng
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-500 p-6 rounded-3xl text-white shadow-lg">
                  <div className="text-4xl md:text-5xl font-extrabold mb-1">
                    5 phút
                  </div>
                  <div className="text-sm font-semibold">
                    Lên lịch ăn hàng tuần
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-extrabold text-3xl md:text-4xl text-gray-800">
                Tại sao chọn Foodi?
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-2xl bg-white shadow-sm border border-gray-50">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">Tự động</h4>
                    <p className="text-gray-500 text-sm mt-1">
                      Tính toán các chỉ số dinh dưỡng chính xác.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-2xl bg-white shadow-sm border border-gray-50">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-800">
                      Tiết kiệm thời gian
                    </h4>
                    <p className="text-gray-500 text-sm mt-1">
                      Lên kế hoạch ăn uống cả tuần chỉ trong 5 phút.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="join" className="py-12 px-4 md:px-10 mb-16">
        <div className="max-w-5xl mx-auto bg-green-600 rounded-[32px] p-8 md:p-16 text-center shadow-xl">
          <div className="space-y-6">
            <h2 className="font-extrabold text-3xl md:text-4xl text-white">
              Sẵn sàng thay đổi bản thân?
            </h2>
            <p className="text-green-50 text-md md:text-lg max-w-xl mx-auto">
              Gia nhập cộng đồng người dùng đã và đang cải thiện sức khỏe cùng
              chúng tôi.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white text-green-600 font-bold px-10 py-4 rounded-full text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                Tham gia
              </button>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
