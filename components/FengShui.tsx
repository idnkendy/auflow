import React from 'react';
import { FengShuiState } from '../state/toolState';
import { FileData, Tool } from '../types';
import * as geminiService from '../services/geminiService';
import * as historyService from '../services/historyService';
import ImageUpload from './common/ImageUpload';
import Spinner from './Spinner';
import ImageComparator from './ImageComparator';

interface FengShuiProps {
    state: FengShuiState;
    onStateChange: (newState: Partial<FengShuiState>) => void;
}

const analysisTypes = [
    { id: 'bat-trach', label: 'Bát Trạch' },
    { id: 'am-trach', label: 'Âm Trạch' },
    { id: 'loan-dau', label: 'Loan Đầu' },
    { id: 'duong-trach', label: 'Dương Trạch' },
    { id: 'huyen-khong', label: 'Huyền không' },
    { id: 'than-sat', label: 'Thần Sát' },
    { id: 'xem-tuoi', label: 'Xem Tuổi' },
    { id: 'ngay-gio-tot', label: 'Ngày giờ tốt' },
    { id: 'van-khan', label: 'Văn Khấn' },
    { id: 'mau-sac', label: 'Màu sắc' },
    { id: 'tien-kiep', label: 'Tiền kiếp' },
];

const typesRequiringImage = ['bat-trach'];

const eventTypes = [
    { value: 'dong-tho', label: 'Động thổ' },
    { value: 'nhap-trach', label: 'Nhập trạch' },
    { value: 'khai-truong', label: 'Khai trương' },
    { value: 'cuoi-hoi', label: 'Cưới hỏi' },
    { value: 'xuat-hanh', label: 'Xuất hành' },
];

const vanKhanTypes = [
    { value: 'dong-tho', label: 'Lễ động thổ (làm móng)' },
    { value: 'cat-noc', label: 'Lễ cất nóc' },
    { value: 'nhap-trach', label: 'Lễ nhập trạch (về nhà mới)' },
    { value: 'sua-chua', label: 'Lễ sửa chữa nhà' },
];

const houseDirections = [
    { value: 'bac-kham', label: 'Bắc (Khảm)' },
    { value: 'dong-bac-can', label: 'Đông Bắc (Cấn)' },
    { value: 'dong-chan', label: 'Đông (Chấn)' },
    { value: 'dong-nam-ton', label: 'Đông Nam (Tốn)' },
    { value: 'nam-ly', label: 'Nam (Ly)' },
    { value: 'tay-nam-khon', label: 'Tây Nam (Khôn)' },
    { value: 'tay-doai', label: 'Tây (Đoài)' },
    { value: 'tay-bac-can', label: 'Tây Bắc (Càn)' },
];

const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
const zodiacHours = [
    { value: 'ty', label: 'Tý (23h-1h)' },
    { value: 'suu', label: 'Sửu (1h-3h)' },
    { value: 'dan', label: 'Dần (3h-5h)' },
    { value: 'mao', label: 'Mão (5h-7h)' },
    { value: 'thin', label: 'Thìn (7h-9h)' },
    { value: 'ti', label: 'Tỵ (9h-11h)' },
    { value: 'ngo', label: 'Ngọ (11h-13h)' },
    { value: 'mui', label: 'Mùi (13h-15h)' },
    { value: 'than', label: 'Thân (15h-17h)' },
    { value: 'dau', label: 'Dậu (17h-19h)' },
    { value: 'tuat', label: 'Tuất (19h-21h)' },
    { value: 'hoi', label: 'Hợi (21h-23h)' },
];

const FengShui: React.FC<FengShuiProps> = ({ state, onStateChange }) => {
    const { 
        name, birthDay, birthMonth, birthYear, gender, analysisType, 
        floorPlanImage, houseDirection, isLoading, error, resultImage, analysisText,
        deathDay, deathMonth, deathYear, deathHour, 
        spouseName, spouseBirthYear, eldestChildName, eldestChildBirthYear,
        graveDirection, terrainDescription, latitude, longitude,
        kitchenDirection, bedroomDirection, eventType, vanKhanType
    } = state;

    const requiresImage = typesRequiringImage.includes(analysisType);
    const showCommonUserInfo = !['huyen-khong', 'than-sat', 'loan-dau', 'van-khan'].includes(analysisType);
    const analysisLabel = analysisTypes.find(t => t.id === analysisType)?.label || 'Bắt đầu';
    
    let buttonText = `Phân tích ${analysisLabel}`;
    if (analysisType === 'huyen-khong') {
        buttonText = 'Xem Huyền Không Phi Tinh';
    } else if (analysisType === 'than-sat') {
        buttonText = 'Phân tích Thần Sát';
    } else if (analysisType === 'ngay-gio-tot') {
        buttonText = 'Xem ngày giờ tốt';
    } else if (analysisType === 'van-khan') {
        buttonText = 'Tạo Văn Khấn';
    } else if (analysisType === 'mau-sac') {
        buttonText = 'Xem màu hợp mệnh';
    }


    const handleGetLocation = () => {
        if (navigator.geolocation) {
            onStateChange({ isLoading: true, error: null });
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    onStateChange({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        isLoading: false,
                        error: null,
                    });
                },
                (err) => {
                    onStateChange({ error: `Lỗi lấy vị trí: ${err.message}`, isLoading: false });
                }
            );
        } else {
            onStateChange({ error: 'Trình duyệt của bạn không hỗ trợ định vị.' });
        }
    };


    const handleAnalyze = async () => {
        
        onStateChange({ isLoading: true, error: null, resultImage: null, analysisText: null });
    
        let prompt = '';

        if (analysisType === 'than-sat') {
            if (!terrainDescription.trim() && !floorPlanImage) {
                onStateChange({ error: 'Vui lòng mô tả hoặc tải lên ảnh về sát khí bạn nghi ngờ.', isLoading: false });
                return;
            }

            const basePrompt = `Bạn là một chuyên gia Phong Thủy. Hãy phân tích về Thần Sát (Sát khí) dựa trên thông tin được cung cấp.`;
            const descriptionPart = terrainDescription.trim() ? `Mô tả của gia chủ: "${terrainDescription}"` : '';
            const requestPartWithImage = `\nYêu cầu:
1. Dựa vào mô tả và hình ảnh, hãy xác định loại sát khí (ví dụ: Thương sát, Đao trảm sát, Liêm đao sát, Xung bối sát, v.v.).
2. Giải thích rõ ràng tác động và ảnh hưởng của loại sát khí này đến ngôi nhà và các thành viên.
3. **Tạo một hình ảnh mới** từ ảnh gốc, trong đó **khoanh vùng và chú thích rõ ràng vị trí của sát khí**.
4. Cung cấp một **bài phân tích văn bản chi tiết** giải thích các đánh dấu trên hình và đưa ra các **phương pháp hóa giải cụ thể, khả thi** (ví dụ: dùng gương bát quái, trồng cây, treo rèm, v.v.).`;
            const requestPartWithoutImage = `\nYêu cầu:
1. Dựa vào mô tả, hãy xác định các loại sát khí có thể có.
2. Giải thích rõ ràng tác động và ảnh hưởng của từng loại sát khí này.
3. Đưa ra các phương pháp hóa giải cụ thể, khả thi cho từng trường hợp.`;

            if (floorPlanImage) {
                prompt = `${basePrompt}\n${descriptionPart}\n- Có hình ảnh đi kèm để phân tích trực quan.${requestPartWithImage}`;
                try {
                    const result = await geminiService.editImage(prompt, floorPlanImage, 1);
                    if (result && result.length > 0) {
                        onStateChange({ resultImage: result[0].imageUrl, analysisText: result[0].text });
                        historyService.addToHistory({
                            tool: Tool.FengShui,
                            prompt: `Phân tích Thần Sát`,
                            sourceImageURL: floorPlanImage.objectURL,
                            resultImageURL: result[0].imageUrl,
                        });
                    } else { throw new Error("Không nhận được kết quả từ AI."); }
                } catch (err: any) { onStateChange({ error: err.message }); } 
                finally { onStateChange({ isLoading: false }); }
            } else {
                prompt = `${basePrompt}\n${descriptionPart}${requestPartWithoutImage}`;
                try {
                    const textResult = await geminiService.generateText(prompt);
                    onStateChange({ analysisText: textResult });
                } catch (err: any) { onStateChange({ error: err.message }); } 
                finally { onStateChange({ isLoading: false }); }
            }
            return; // End the function here for 'than-sat'
        }


        if (!birthYear && !['loan-dau', 'huyen-khong', 'van-khan'].includes(analysisType)) {
            onStateChange({ error: 'Vui lòng nhập năm sinh.', isLoading: false });
            return;
        }

        if (analysisType === 'huyen-khong') {
            if (!floorPlanImage) {
                onStateChange({ error: 'Vui lòng tải lên mặt bằng để phân tích.', isLoading: false });
                return;
            }
            if (!birthYear) {
                onStateChange({ error: 'Vui lòng nhập năm xây dựng.', isLoading: false });
                return;
            }
            prompt = `Bạn là một bậc thầy Phong Thủy. Hãy lập sơ đồ Huyền Không Phi Tinh cho mặt bằng được cung cấp.
            Thông tin:
            - Hướng nhà: ${houseDirections.find(d => d.value === houseDirection)?.label}
            - Năm xây dựng (dương lịch): ${birthYear}
    
            Yêu cầu:
            1. Tạo một hình ảnh mới từ mặt bằng gốc. Trong hình ảnh mới, hãy **vẽ sơ đồ phi tinh bàn** của ngôi nhà. Sơ đồ phải hiển thị cửu cung, sơn tinh, hướng tinh, và vận tinh một cách rõ ràng và trực quan trên mặt bằng.
            2. Cung cấp một bài phân tích chi tiết bằng văn bản tiếng Việt, giải thích ý nghĩa của các sao tại mỗi cung và ảnh hưởng của chúng (cát/hung), kèm theo các gợi ý hóa giải hoặc kích hoạt.`;
    
            try {
                const result = await geminiService.editImage(prompt, floorPlanImage, 1);
                if (result && result.length > 0) {
                    onStateChange({ resultImage: result[0].imageUrl, analysisText: result[0].text });
                    historyService.addToHistory({
                        tool: Tool.FengShui,
                        prompt: `Phân tích Huyền Không Phi Tinh`,
                        sourceImageURL: floorPlanImage.objectURL,
                        resultImageURL: result[0].imageUrl,
                    });
                } else { throw new Error("Không nhận được kết quả từ AI."); }
            } catch (err: any) { onStateChange({ error: err.message }); } 
            finally { onStateChange({ isLoading: false }); }
            return; 
        }

        if (analysisType === 'ngay-gio-tot') {
            if (!birthYear) {
                onStateChange({ error: 'Vui lòng nhập năm sinh gia chủ.', isLoading: false });
                return;
            }
            const eventLabel = eventTypes.find(e => e.value === eventType)?.label || 'làm việc đại sự';
            prompt = `Bạn là một chuyên gia xem ngày lành tháng tốt. Hãy tìm ngày giờ tốt để ${eventLabel} cho gia chủ.
    
            Thông tin gia chủ:
            - Giới tính: ${gender === 'male' ? 'Nam' : 'Nữ'}
            - Năm sinh âm lịch: ${birthYear}
    
            Yêu cầu:
            Phân tích và đưa ra một danh sách các ngày giờ tốt nhất trong vòng 3 tháng tới (kể từ ngày hiện tại) để thực hiện việc "${eventLabel}".
            Với mỗi ngày tốt, hãy liệt kê rõ:
            1. Ngày dương lịch và ngày âm lịch.
            2. Các giờ hoàng đạo (giờ tốt) trong ngày.
            3. Luận giải ngắn gọn tại sao ngày/giờ đó tốt cho tuổi của gia chủ và công việc cụ thể này.
            4. Những tuổi xung khắc cần tránh trong ngày đó.
            
            Trình bày kết quả một cách rõ ràng, dễ hiểu.`;

            try {
                const textResult = await geminiService.generateText(prompt);
                onStateChange({ analysisText: textResult });
            } catch (err: any) { onStateChange({ error: err.message }); } 
            finally { onStateChange({ isLoading: false }); }
            return;
        }

        if (analysisType === 'van-khan') {
            const vanKhanLabel = vanKhanTypes.find(v => v.value === vanKhanType)?.label || 'sự kiện';
            prompt = `Bạn là một chuyên gia về văn khấn cổ truyền Việt Nam. Hãy soạn một bài văn khấn đầy đủ và chi tiết cho "${vanKhanLabel}" cho gia chủ.

            Thông tin gia chủ (nếu có):
            - Tên: ${name || '(gia chủ)'}
            - Giới tính: ${gender === 'male' ? 'Nam' : 'Nữ'}
            - Năm sinh âm lịch: ${birthYear || '(không rõ)'}

            Yêu cầu:
            1. Soạn bài văn khấn trang trọng, đúng nghi lễ, câu từ thành kính.
            2. Liệt kê danh sách các lễ vật cần chuẩn bị cho mâm cúng.
            3. Hướng dẫn các bước tiến hành nghi lễ một cách ngắn gọn, dễ hiểu.

            Trình bày kết quả một cách rõ ràng, có phân mục cụ thể.`;

            try {
                const textResult = await geminiService.generateText(prompt);
                onStateChange({ analysisText: textResult });
            } catch (err: any) { 
                onStateChange({ error: err.message }); 
            } finally { 
                onStateChange({ isLoading: false }); 
            }
            return;
        }
    
        // Handle Loan Dau
        if (analysisType === 'loan-dau') {
            prompt = `Bạn là một chuyên gia phong thủy, hãy thực hiện phân tích Loan Đầu (địa hình, địa thế) dựa trên các thông tin sau:\n- Mô tả: ${terrainDescription || 'Không có'}`;
            if (latitude && longitude) {
                prompt += `\n- Vị trí địa lý (vĩ độ, kinh độ): ${latitude}, ${longitude}. Hãy sử dụng thông tin này để phân tích địa thế xung quanh qua bản đồ (ví dụ: sông, núi, đường đi, các công trình lân cận).`;
            }
            
            if (floorPlanImage) {
                prompt += `\n- Hình ảnh công trình/khu đất được cung cấp.\n\nYêu cầu:\n1. Phân tích các yếu tố Loan Đầu: long mạch, sa, thủy, huyệt, minh đường, thanh long, bạch hổ, chu tước, huyền vũ dựa trên tất cả thông tin được cung cấp.\n2. Tạo một hình ảnh mới từ ảnh gốc, trong đó **đánh dấu và chú thích các yếu tố địa hình, phương vị quan trọng** mà bạn phân tích được.\n3. Cung cấp một bài phân tích văn bản chi tiết giải thích các đánh dấu và luận giải ảnh hưởng tốt/xấu, kèm theo gợi ý cải thiện.`;
                 try {
                    const result = await geminiService.editImage(prompt, floorPlanImage, 1);
                    if (result && result.length > 0) {
                        onStateChange({ resultImage: result[0].imageUrl, analysisText: result[0].text });
                         historyService.addToHistory({
                            tool: Tool.FengShui,
                            prompt: `Phân tích Loan Đầu`,
                            sourceImageURL: floorPlanImage.objectURL,
                            resultImageURL: result[0].imageUrl,
                        });
                    } else { throw new Error("Không nhận được kết quả từ AI."); }
                } catch (err: any) { onStateChange({ error: err.message }); } 
                finally { onStateChange({ isLoading: false }); }

            } else {
                prompt += `\n\nYêu cầu:\n1. Dựa vào mô tả và vị trí (nếu có), phân tích các yếu tố Loan Đầu.\n2. Luận giải chi tiết về các ảnh hưởng tốt/xấu của địa thế này.\n3. Đưa ra các gợi ý để cải thiện hoặc tận dụng địa thế.`;
                try {
                    const textResult = await geminiService.generateText(prompt);
                    onStateChange({ analysisText: textResult });
                } catch (err: any) { onStateChange({ error: err.message }); } 
                finally { onStateChange({ isLoading: false }); }
            }
            return;
        }

        // Handle Am Trach
        if (analysisType === 'am-trach') {
            const deathHourLabel = zodiacHours.find(h => h.value === deathHour)?.label || '';
            const deceasedInfo = `Thông tin người đã khuất:\n- Giới tính: ${gender === 'male' ? 'Nam' : 'Nữ'}\n- Năm sinh âm lịch: ${birthYear}${deathYear ? `\n- Ngày mất âm lịch: ${deathDay}/${deathMonth}/${deathYear}, giờ ${deathHourLabel}` : ''}`;
            
            let relativeParts = [];
            if (spouseName) relativeParts.push(`Vợ/Chồng: ${spouseName} (năm sinh: ${spouseBirthYear || 'N/A'})`);
            if (eldestChildName) relativeParts.push(`Con trưởng: ${eldestChildName} (năm sinh: ${eldestChildBirthYear || 'N/A'})`);

            const relativeText = relativeParts.length > 0 ? `\nThông tin người thân liên quan:\n- ${relativeParts.join('\n- ')}` : '';

            const graveInfo = `Thông tin mộ phần:\n- Hướng mộ: ${houseDirections.find(d => d.value === graveDirection)?.label}\n- Mô tả địa thế (Loan Đầu): ${terrainDescription || 'Không có'}`;
            
            const basePrompt = `Phân tích phong thủy Âm Trạch cho phần mộ.\n${deceasedInfo}${relativeText}\n${graveInfo}`;
    
            if (floorPlanImage) { 
                prompt = `${basePrompt}\n- Hình ảnh hiện trạng/bản đồ được cung cấp.\n\nYêu cầu:\n1. Phân tích các yếu-tố long, huyệt, sa, thủy dựa trên thông tin và hình ảnh.\n2. Tạo một hình ảnh mới từ ảnh gốc. Trong hình ảnh mới, hãy **đánh dấu và chú thích các khu vực, phương vị quan trọng** (ví dụ: long mạch, minh đường, thanh long, bạch hổ) bằng màu sắc và văn bản.\n3. Cung cấp một bài phân tích chi tiết bằng văn bản tiếng Việt, giải thích các đánh dấu trên hình ảnh và đưa ra các luận giải, gợi ý cụ thể.`;
                try {
                    const result = await geminiService.editImage(prompt, floorPlanImage, 1);
                    if (result && result.length > 0) {
                        onStateChange({ resultImage: result[0].imageUrl, analysisText: result[0].text });
                        historyService.addToHistory({ tool: Tool.FengShui, prompt: `Phân tích Âm Trạch`, sourceImageURL: floorPlanImage.objectURL, resultImageURL: result[0].imageUrl });
                    } else { throw new Error("Không nhận được kết quả phân tích từ AI."); }
                } catch (err: any) { onStateChange({ error: err.message }); } 
                finally { onStateChange({ isLoading: false }); }
            } else { 
                prompt = `${basePrompt}\n\nYêu cầu:\n1. Dựa vào các thông tin trên, phân tích các yếu-tố long, huyệt, sa, thủy.\n2. Luận giải chi tiết về các ảnh hưởng tốt/xấu của thế đất và hướng mộ này đối với con cháu.\n3. Đưa ra các gợi ý hóa giải hoặc phương án tối ưu nếu có.`;
                try {
                    const textResult = await geminiService.generateText(prompt);
                    onStateChange({ analysisText: textResult });
                } catch (err: any) { onStateChange({ error: err.message }); } 
                finally { onStateChange({ isLoading: false }); }
            }
            return; 
        }

        if (analysisType === 'duong-trach') {
            const houseDirLabel = houseDirections.find(d => d.value === houseDirection)?.label || 'Không rõ';
            const kitchenDirLabel = houseDirections.find(d => d.value === kitchenDirection)?.label || 'Không rõ';
            const bedroomDirLabel = houseDirections.find(d => d.value === bedroomDirection)?.label || 'Không rõ';
    
            prompt = `Bạn là một chuyên gia phong thủy. Hãy thực hiện phân tích chi tiết về Dương Trạch (nhà ở) cho gia chủ dựa trên các thông tin sau:
    
            Thông tin gia chủ:
            - Giới tính: ${gender === 'male' ? 'Nam' : 'Nữ'}
            - Năm sinh âm lịch: ${birthYear}
    
            Thông tin nhà:
            - Hướng nhà (hướng cửa chính): ${houseDirLabel}
            - Hướng bếp (hướng táo): ${kitchenDirLabel}
            - Hướng phòng ngủ chính: ${bedroomDirLabel}
    
            Yêu cầu:
            1. Xác định cung mệnh (Đông tứ mệnh hay Tây tứ mệnh) của gia chủ.
            2. Phân tích sự tương hợp giữa cung mệnh gia chủ với hướng nhà, hướng bếp và hướng phòng ngủ.
            3. Luận giải chi tiết về các yếu tố tốt và xấu (sinh khí, diên niên, thiên y, phục vị, tuyệt mệnh, ngũ quỷ, lục sát, họa hại) cho từng hướng.
            4. Đưa ra các kết luận tổng quan và các gợi ý, phương pháp hóa giải cụ thể nếu có.`;
    
            try {
                const textResult = await geminiService.generateText(prompt);
                onStateChange({ analysisText: textResult });
            } catch (err: any) { onStateChange({ error: err.message }); } 
            finally { onStateChange({ isLoading: false }); }
    
            return; // Exit after handling
        }
    
        // Handle other types
        if (requiresImage) {
            if (!floorPlanImage) {
                onStateChange({ error: 'Vui lòng tải lên mặt bằng để phân tích.', isLoading: false });
                return;
            }
            
            prompt = `Phân tích phong thủy theo trường phái "${analysisLabel}" cho mặt bằng được cung cấp.
            Thông tin gia chủ:
            - Giới tính: ${gender === 'male' ? 'Nam' : 'Nữ'}
            - Năm sinh âm lịch: ${birthYear}
            Thông tin nhà:
            - Hướng nhà: ${houseDirections.find(d => d.value === houseDirection)?.label}
    
            Yêu cầu:
            1. Phân tích các yếu tố chính theo trường phái ${analysisLabel} dựa trên thông tin gia chủ và mặt bằng.
            2. Tạo một hình ảnh mới từ mặt bằng gốc. Trong hình ảnh mới, hãy **đánh dấu và chú thích các khu vực quan trọng** (cung tốt, cung xấu, vị trí cần lưu ý) một cách trực quan bằng màu sắc và văn bản.
            3. Cung cấp một bài phân tích chi tiết bằng văn bản tiếng Việt, giải thích các đánh dấu trên hình ảnh và đưa ra các gợi ý cụ thể để tối ưu hóa không gian hoặc hóa giải các vấn đề phong thủy.`;

            try {
                const result = await geminiService.editImage(prompt, floorPlanImage, 1);
                 if (result && result.length > 0) {
                    onStateChange({ resultImage: result[0].imageUrl, analysisText: result[0].text });
                    historyService.addToHistory({ tool: Tool.FengShui, prompt: `Phân tích ${analysisLabel} cho gia chủ ${gender === 'male' ? 'Nam' : 'Nữ'} sinh năm ${birthYear}, nhà hướng ${houseDirection}`, sourceImageURL: floorPlanImage.objectURL, resultImageURL: result[0].imageUrl });
                } else { throw new Error("Không nhận được kết quả phân tích từ AI."); }
            } catch (err: any) { onStateChange({ error: err.message }); } 
            finally { onStateChange({ isLoading: false }); }
        } else {
             switch(analysisType) {
                case 'xem-tuoi':
                    prompt = `Phân tích chi tiết về tuổi của gia chủ. Thông tin: Họ tên ${name}, Giới tính ${gender === 'male' ? 'Nam' : 'Nữ'}, sinh ngày ${birthDay}/${birthMonth}/${birthYear}. Phân tích về mệnh, các năm tam tai, hướng tốt, màu sắc hợp mệnh, và các con số may mắn.`;
                    break;
                case 'mau-sac':
                     prompt = `Tư vấn màu sắc hợp phong thủy cho gia chủ. Thông tin: Giới tính ${gender === 'male' ? 'Nam' : 'Nữ'}, sinh năm ${birthYear}. Gợi ý chi tiết màu sơn nhà (phòng khách, phòng ngủ), màu xe, và màu trang phục nên/không nên dùng.`;
                    break;
                case 'tien-kiep':
                    prompt = `Dựa vào thông tin ngày tháng năm sinh, hãy kể một câu chuyện ngắn mang tính tham khảo và giải trí về tiền kiếp có thể có của người này. Thông tin: Họ tên ${name}, Giới tính ${gender === 'male' ? 'Nam' : 'Nữ'}, sinh ngày ${birthDay}/${birthMonth}/${birthYear}.`;
                    break;
                default:
                     prompt = `Phân tích phong thủy về "${analysisLabel}" cho gia chủ. Thông tin: Họ tên ${name}, Giới tính ${gender === 'male' ? 'Nam' : 'Nữ'}, sinh ngày ${birthDay}/${birthMonth}/${birthYear}.`;
            }
            try {
                const textResult = await geminiService.generateText(prompt);
                onStateChange({ analysisText: textResult });
            } catch (err: any) { onStateChange({ error: err.message }); } 
            finally { onStateChange({ isLoading: false }); }
        }
    };
    
    const renderResultModal = () => (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => onStateChange({ resultImage: null, analysisText: null })}
        >
            <div 
                className="bg-surface dark:bg-dark-bg p-4 sm:p-6 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                {(requiresImage || ['am-trach', 'loan-dau', 'than-sat', 'huyen-khong'].includes(analysisType) && floorPlanImage) && resultImage && floorPlanImage && (
                    <div className="lg:w-1/2 flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-text-primary dark:text-white">Kết quả Phân tích Phong thủy</h3>
                        <div className="aspect-video w-full">
                            <ImageComparator originalImage={floorPlanImage.objectURL} resultImage={resultImage} />
                        </div>
                    </div>
                )}
                <div className={(requiresImage || ['am-trach', 'loan-dau', 'than-sat', 'huyen-khong'].includes(analysisType) && floorPlanImage) && resultImage ? "lg:w-1/2" : "w-full"}>
                    <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Diễn giải & Gợi ý</h3>
                    <div className="bg-main-bg dark:bg-gray-800 p-4 rounded-lg h-[65vh] overflow-y-auto prose dark:prose-invert prose-sm max-w-none text-text-primary dark:text-gray-300">
                       {analysisText ? (
                          <p style={{ whiteSpace: 'pre-wrap' }}>{analysisText}</p>
                       ) : <p>Không có diễn giải chi tiết.</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInputs = () => {
        if (analysisType === 'huyen-khong') {
            return (
                <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                    <input 
                        type="number" 
                        placeholder="Năm xây dựng" 
                        value={birthYear} 
                        onChange={e => onStateChange({ birthYear: e.target.value })} 
                        className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all"
                    />
                     <div className="relative">
                        <select value={houseDirection} onChange={e => onStateChange({ houseDirection: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                            {houseDirections.map(dir => <option key={dir.value} value={dir.value}>{dir.label}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                     <ImageUpload onFileSelect={(file) => onStateChange({ floorPlanImage: file })} previewUrl={floorPlanImage?.objectURL} />
                </div>
            );
        }

        if (analysisType === 'than-sat') {
            return (
                <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                    <textarea
                        placeholder="Mô tả các vật thể hoặc kiến trúc bên ngoài nhà bạn nghi ngờ là sát khí. Ví dụ: 'Đối diện cửa chính có một cột điện', 'Ban công nhìn ra một góc nhọn của tòa nhà đối diện'..."
                        value={terrainDescription}
                        onChange={e => onStateChange({ terrainDescription: e.target.value })}
                        className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all"
                        rows={5}
                    />
                    <p className="text-xs text-text-secondary dark:text-gray-400 text-center">- hoặc -</p>
                    <ImageUpload 
                        onFileSelect={(file) => onStateChange({ floorPlanImage: file })} 
                        previewUrl={floorPlanImage?.objectURL} 
                    />
                </div>
            );
        }

        if (analysisType === 'ngay-gio-tot') {
            return (
                <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                     <div className="relative">
                        <select 
                            value={eventType} 
                            onChange={e => onStateChange({ eventType: e.target.value })} 
                            className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8"
                        >
                            {eventTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                     <div className="text-center text-sm text-blue-500 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-500/50">
                        AI sẽ phân tích tuổi của bạn để tìm ra những ngày giờ tốt nhất trong 3 tháng tới.
                    </div>
                </div>
            );
        }

        if (analysisType === 'van-khan') {
            return (
                <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                     <div className="relative">
                        <select 
                            value={vanKhanType} 
                            onChange={e => onStateChange({ vanKhanType: e.target.value })} 
                            className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8"
                        >
                            {vanKhanTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            );
        }

        if (analysisType === 'loan-dau') {
            return (
                <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                    <ImageUpload 
                        onFileSelect={(file) => onStateChange({ floorPlanImage: file })} 
                        previewUrl={floorPlanImage?.objectURL} 
                    />
                    <textarea
                        placeholder="Mô tả thêm về địa hình, đường xá, công trình xung quanh..."
                        value={terrainDescription}
                        onChange={e => onStateChange({ terrainDescription: e.target.value })}
                        className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all"
                        rows={4}
                    />
                     <div className="bg-main-bg dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-text-secondary dark:text-gray-300 text-sm tracking-wider uppercase">VỊ TRÍ ĐỊA LÝ (TÙY CHỌN)</h3>
                        <p className="text-xs text-text-secondary/70 dark:text-gray-400/70 mt-1 mb-3">Cung cấp vị trí để AI phân tích địa thế xung quanh bằng bản đồ.</p>
                        <button
                            onClick={handleGetLocation}
                            disabled={isLoading}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-text-primary font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            {isLoading && !latitude ? 'Đang lấy...' : 'Lấy vị trí hiện tại'}
                        </button>
                        {latitude && longitude && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                                Đã lấy vị trí: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        if (analysisType === 'am-trach') {
            return (
                 <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                    {/* Deceased Info */}
                     <div className="space-y-2">
                        <h3 className="font-semibold text-text-secondary dark:text-gray-400 text-sm tracking-wider uppercase">THÔNG TIN NGÀY MẤT</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <select value={deathDay} onChange={e => onStateChange({ deathDay: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                                <option value="" disabled>Ngày</option>{days.map(d => <option key={`d-${d}`} value={d}>{d}</option>)}
                            </select>
                            <select value={deathMonth} onChange={e => onStateChange({ deathMonth: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                                <option value="" disabled>Tháng</option>{months.map(m => <option key={`m-${m}`} value={m}>{m}</option>)}
                            </select>
                            <input type="number" placeholder="Năm" value={deathYear} onChange={e => onStateChange({ deathYear: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all" />
                        </div>
                        <select value={deathHour} onChange={e => onStateChange({ deathHour: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                            {zodiacHours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                    </div>
                    {/* Relative Info */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-text-secondary dark:text-gray-400 text-sm tracking-wider uppercase">THÔNG TIN NGƯỜI THÂN (TÙY CHỌN)</h3>
                        <input type="text" placeholder="Tên Vợ/Chồng" value={spouseName} onChange={e => onStateChange({ spouseName: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all" />
                        <input type="number" placeholder="Năm sinh Vợ/Chồng" value={spouseBirthYear} onChange={e => onStateChange({ spouseBirthYear: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all" />
                        <input type="text" placeholder="Tên Con trưởng" value={eldestChildName} onChange={e => onStateChange({ eldestChildName: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all" />
                        <input type="number" placeholder="Năm sinh Con trưởng" value={eldestChildBirthYear} onChange={e => onStateChange({ eldestChildBirthYear: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all" />
                    </div>
                    {/* Grave Info */}
                    <div className="space-y-2">
                         <h3 className="font-semibold text-text-secondary dark:text-gray-400 text-sm tracking-wider uppercase">HƯỚNG MỘ</h3>
                         <select value={graveDirection} onChange={e => onStateChange({ graveDirection: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                            {houseDirections.map(dir => <option key={dir.value} value={dir.value}>{dir.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-text-secondary dark:text-gray-400 text-sm tracking-wider uppercase">ĐỊA THẾ (LOAN ĐẦU)</h3>
                        <textarea placeholder="Mô tả địa thế: long, huyệt, sa, thuỷ..." value={terrainDescription} onChange={e => onStateChange({ terrainDescription: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all" rows={4}/>
                    </div>
                    <div>
                        <label className="text-xs text-text-secondary dark:text-gray-400 mb-1 block">Tải Lên Ảnh Hiện Trạng/Bản Đồ (Tùy chọn)</label>
                        <ImageUpload onFileSelect={(file) => onStateChange({ floorPlanImage: file })} previewUrl={floorPlanImage?.objectURL} />
                    </div>
                </div>
            );
        }

        if (analysisType === 'duong-trach') {
            return (
                <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                    <div className="relative">
                        <select value={houseDirection} onChange={e => onStateChange({ houseDirection: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                            {houseDirections.map(dir => <option key={`house-${dir.value}`} value={dir.value}>{dir.label}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                    <div className="relative">
                        <select value={kitchenDirection} onChange={e => onStateChange({ kitchenDirection: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                            {houseDirections.map(dir => <option key={`kitchen-${dir.value}`} value={dir.value}>{dir.label}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                    <div className="relative">
                        <select value={bedroomDirection} onChange={e => onStateChange({ bedroomDirection: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                            {houseDirections.map(dir => <option key={`bed-${dir.value}`} value={dir.value}>{dir.label}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                </div>
            );
        }

        if (requiresImage) {
            return (
                 <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                    <ImageUpload onFileSelect={(file) => onStateChange({ floorPlanImage: file })} previewUrl={floorPlanImage?.objectURL} />
                     <div className="relative">
                        <select value={houseDirection} onChange={e => onStateChange({ houseDirection: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                            {houseDirections.map(dir => <option key={dir.value} value={dir.value}>{dir.label}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                </div>
            );
        }

        return null;
    }

    return (
        <div className="space-y-6">
            {(resultImage || analysisText) && renderResultModal()}
            <h2 className="text-2xl font-bold text-text-primary dark:text-white text-center">Phong thủy</h2>
            <div className="space-y-6">
                 <div className="flex flex-wrap gap-2 justify-center">
                    {analysisTypes.map(type => (
                        <button
                            key={type.id}
                            onClick={() => onStateChange({ analysisType: type.id })}
                            className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors ${analysisType === type.id ? 'bg-yellow-500 text-text-primary' : 'bg-main-bg dark:bg-gray-700/50 text-text-secondary dark:text-gray-300'}`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {showCommonUserInfo && (
                    <div className="bg-main-bg/50 dark:bg-dark-bg/50 p-4 rounded-xl border border-border-color dark:border-gray-700 space-y-4">
                        <h3 className="font-semibold text-text-secondary dark:text-gray-400 text-sm tracking-wider uppercase text-center">{analysisType === 'am-trach' ? 'Thông Tin Người Mất' : 'Thông Tin Gia Chủ'}</h3>
                        <input type="text" placeholder="Họ và tên" value={name} onChange={e => onStateChange({ name: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all"/>
                        <div className="grid grid-cols-3 gap-2">
                             <div className="relative">
                                <select value={birthDay} onChange={e => onStateChange({ birthDay: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                                    <option value="" disabled>Ngày</option>{days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            <div className="relative">
                                <select value={birthMonth} onChange={e => onStateChange({ birthMonth: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 focus:ring-2 focus:ring-accent focus:outline-none transition-all appearance-none pr-8">
                                     <option value="" disabled>Tháng</option>{months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-gray-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                             <input type="number" placeholder="Năm sinh" value={birthYear} onChange={e => onStateChange({ birthYear: e.target.value })} className="w-full bg-surface dark:bg-gray-700/50 border border-border-color dark:border-gray-600 rounded-lg p-3 text-text-primary dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-accent focus:outline-none transition-all"/>
                        </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => onStateChange({ gender: 'male' })} className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${gender === 'male' ? 'bg-yellow-500 text-text-primary shadow' : 'bg-main-bg dark:bg-gray-700/50 text-text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Nam</button>
                            <button onClick={() => onStateChange({ gender: 'female' })} className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${gender === 'female' ? 'bg-yellow-500 text-text-primary shadow' : 'bg-main-bg dark:bg-gray-700/50 text-text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Nữ</button>
                        </div>
                    </div>
                )}

                {renderInputs()}
                
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-text-primary font-bold py-3 px-4 rounded-lg transition-colors"
                >
                   {isLoading ? <><Spinner /> Đang phân tích...</> : buttonText}
                </button>
                {error && <div className="p-3 bg-red-100 border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300 rounded-lg text-sm">{error}</div>}
            </div>
        </div>
    );
};

export default FengShui;
