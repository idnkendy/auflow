import React from 'react';

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const QRCodeIcon = () => (
    <svg className="w-40 h-40 text-gray-800 bg-white p-2 rounded-lg" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M128 256a128 128 0 1 1 128-128 128 128 0 0 1-128 128Z"/>
        <path fill="#fff" d="M128 0a128 128 0 0 0 0 256V0Z"/>
        <path fill="currentColor" d="M188 68v40h-40V68ZM88 68v40H48V68ZM68 48H48v20h20Zm20 0V28H68v20Zm100 0h20v20h-20Zm-20 20V48h20v20Zm0 0h20v20h-20Zm-20-20H88v20h80ZM68 88H48v20h20Zm20 0V68H68v20Zm-20 20H48v20h20Zm0 20H48v20h20Zm0 20H48v20h20Zm0 20H48v20h20Zm20-20H68v20h20Zm20 0H88v20h20Zm-20-20H68v20h20Zm100 80v-20h20v20Zm-20-20v-20h20v20Zm0-20v-20h20v20Zm0-20v-20h20v20Zm-20 60v-20h20v20Zm0-20v-20h20v20Zm-20-20v-20h20v20Zm-20 0v-20h20v20Zm-20 0v-20h20v20Zm-20 0v-20h20v20Zm0-20v-20h20v20Zm20 20v20h20v-20Zm40 0v20h20v-20Zm-60-60H88v20h20Zm20 0h20v20h-20Zm0 20H88v20h40Zm0 20h20v20h-20Zm-20 20H88v20h20Zm100-20h-20v20h20Zm-20-20h-20v20h20Zm0-20h-20v20h20Z"/>
    </svg>
);


const Checkout: React.FC = () => {
    return (
        <div>
            <h2 className="text-3xl font-bold text-text-primary dark:text-white mb-2 text-center">Thanh toán & Nâng cấp Gói</h2>
            <p className="text-text-secondary dark:text-gray-300 mb-10 text-center max-w-2xl mx-auto">Chọn gói phù hợp với nhu cầu của bạn. Thanh toán sẽ được xác nhận thủ công trong vòng 24 giờ.</p>

            {/* Pricing Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-start">
                {/* Plan 1: Basic */}
                <div className="bg-main-bg/50 dark:bg-dark-bg/50 border border-border-color dark:border-gray-700 rounded-xl p-8 flex flex-col h-full">
                    <h3 className="text-2xl font-bold text-text-primary dark:text-white">Cơ Bản</h3>
                    <p className="text-text-secondary dark:text-gray-300 mt-1 mb-6">Lý tưởng cho người mới bắt đầu và các dự án nhỏ.</p>
                    <p className="text-4xl font-bold text-text-primary dark:text-white mb-6">199.000<span className="text-lg font-medium text-text-secondary dark:text-gray-400"> đ/tháng</span></p>
                    <ul className="space-y-4 text-text-secondary dark:text-gray-200 mb-8 flex-grow">
                        <li className="flex items-start gap-3"><CheckIcon /> 50 lượt tạo ảnh</li>
                        <li className="flex items-start gap-3"><CheckIcon /> 5 lượt tạo video</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Chất lượng tiêu chuẩn</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Hỗ trợ qua email</li>
                    </ul>
                    <button className="w-full mt-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Chọn Gói Cơ Bản</button>
                </div>

                {/* Plan 2: Advanced (Highlighted) */}
                <div className="bg-accent/10 dark:bg-accent/20 border-2 border-accent rounded-xl p-8 flex flex-col h-full relative shadow-2xl shadow-accent/20">
                    <span className="absolute top-0 right-8 -mt-3 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">PHỔ BIẾN NHẤT</span>
                    <h3 className="text-2xl font-bold text-text-primary dark:text-white">Nâng Cao</h3>
                    <p className="text-text-secondary dark:text-gray-200 mt-1 mb-6">Dành cho kiến trúc sư và nhà thiết kế chuyên nghiệp.</p>
                    <p className="text-4xl font-bold text-text-primary dark:text-white mb-6">599.000<span className="text-lg font-medium text-text-secondary dark:text-gray-400"> đ/tháng</span></p>
                    <ul className="space-y-4 text-text-secondary dark:text-gray-200 mb-8 flex-grow">
                        <li className="flex items-start gap-3"><CheckIcon /> 250 lượt tạo ảnh</li>
                        <li className="flex items-start gap-3"><CheckIcon /> 25 lượt tạo video</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Chất lượng cao (HD & Full HD)</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Ưu tiên hàng đợi xử lý</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Hỗ trợ ưu tiên qua Zalo</li>
                    </ul>
                    <button className="w-full mt-auto bg-accent hover:bg-accent-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">Chọn Gói Nâng Cao</button>
                </div>

                {/* Plan 3: VIP */}
                 <div className="bg-main-bg/50 dark:bg-dark-bg/50 border border-border-color dark:border-gray-700 rounded-xl p-8 flex flex-col h-full">
                    <h3 className="text-2xl font-bold text-text-primary dark:text-white">VIP</h3>
                    <p className="text-text-secondary dark:text-gray-300 mt-1 mb-6">Giải pháp toàn diện cho các studio và doanh nghiệp lớn.</p>
                    <p className="text-4xl font-bold text-text-primary dark:text-white mb-6">1.000.000<span className="text-lg font-medium text-text-secondary dark:text-gray-400"> đ/tháng</span></p>
                    <ul className="space-y-4 text-text-secondary dark:text-gray-200 mb-8 flex-grow">
                        <li className="flex items-start gap-3"><CheckIcon /> Không giới hạn tạo ảnh & video</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Chất lượng cao nhất (2K & 4K)</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Hàng đợi xử lý riêng</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Hỗ trợ chuyên biệt 24/7</li>
                        <li className="flex items-start gap-3"><CheckIcon /> Truy cập sớm các tính năng mới</li>
                    </ul>
                    <button className="w-full mt-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Chọn Gói VIP</button>
                </div>
            </div>

            {/* Payment Information */}
            <div className="bg-main-bg/50 dark:bg-dark-bg/50 rounded-2xl shadow-lg p-8 border border-border-color dark:border-gray-700 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                <div className="flex-shrink-0 text-center">
                    <p className="text-text-secondary dark:text-gray-300 mb-2">Quét mã QR để thanh toán</p>
                    <QRCodeIcon />
                </div>
                <div className="w-full max-w-md">
                     <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Thông tin chuyển khoản</h3>
                     <div className="space-y-3 text-lg">
                        <p className="text-text-secondary dark:text-gray-300">Ngân hàng: <span className="font-semibold text-text-primary dark:text-gray-100 ml-2">MB Bank (Ngân hàng Quân đội)</span></p>
                        <p className="text-text-secondary dark:text-gray-300">Chủ tài khoản: <span className="font-semibold text-text-primary dark:text-gray-100 ml-2">NGUYEN VAN A</span></p>
                        <p className="text-text-secondary dark:text-gray-300">Số tài khoản: <span className="font-semibold text-text-primary dark:text-gray-100 ml-2">0123456789</span></p>
                     </div>
                     <div className="mt-6 p-4 bg-yellow-100/50 dark:bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-300">Nội dung chuyển khoản (quan trọng):</p>
                        <p className="text-text-primary dark:text-yellow-200 font-mono mt-1">[Tên của bạn] [Số điện thoại đăng ký]</p>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;