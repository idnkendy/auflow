import { FileData, AspectRatio, Tool } from '../types';

// Định nghĩa cấu trúc trạng thái cho từng công cụ

export interface ImageGeneratorState {
    style: string;
    context: string;
    lighting: string;
    weather: string;
    buildingType: string;
    customPrompt: string;
    referenceImage: FileData | null;
    sourceImage: FileData | null;
    isLoading: boolean;
    isUpscaling: boolean;
    error: string | null;
    resultImages: string[];
    upscaledImage: string | null;
    numberOfImages: number;
    aspectRatio: AspectRatio;
}

export interface InteriorGeneratorState extends Omit<ImageGeneratorState, 'buildingType' | 'context' | 'weather'> {
    roomType: string;
    colorPalette: string;
}

export interface UrbanPlanningState {
    viewType: string;
    density: string;
    lighting: string;
    customPrompt: string;
    referenceImage: FileData | null;
    sourceImage: FileData | null;
    isLoading: boolean;
    isUpscaling: boolean;
    error: string | null;
    resultImages: string[];
    upscaledImage: string | null;
    numberOfImages: number;
    aspectRatio: AspectRatio;
}

export interface LandscapeRenderingState {
    gardenStyle: string;
    timeOfDay: string;
    features: string;
    customPrompt: string;
    referenceImage: FileData | null;
    sourceImage: FileData | null;
    isLoading: boolean;
    isUpscaling: boolean;
    error: string | null;
    resultImages: string[];
    upscaledImage: string | null;
    numberOfImages: number;
    aspectRatio: AspectRatio;
}

export interface VideoGeneratorState {
    prompt: string;
    startImage: FileData | null;
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    generatedVideoUrl: string | null;
    mode: 'exterior' | 'interior';
}

export interface ImageEditorState {
    prompt: string;
    sourceImage: FileData | null;
    maskImage: FileData | null;
    referenceImages: FileData[];
    isLoading: boolean;
    error: string | null;
    resultImages: string[];
    numberOfImages: number;
}

export interface ViewSyncState {
    sourceImage: FileData | null;
    directionImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    resultImages: string[];
    numberOfImages: number;
    sceneType: 'exterior' | 'interior';
    aspectRatio: AspectRatio;
    customPrompt: string;
    selectedPerspective: string;
    selectedAtmosphere: string;
    selectedFraming: string;
    selectedInteriorAngle: string;
}

export interface VirtualTourState {
    sourceImage: FileData | null;
    currentTourImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    tourStepSize: number;
    tourHistory: FileData[];
}

export interface RenovationState {
    prompt: string;
    sourceImage: FileData | null;
    referenceImage: FileData | null;
    maskImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    renovatedImages: string[];
    numberOfImages: number;
    aspectRatio: AspectRatio;
}

export interface FloorPlanState {
    prompt: string;
    layoutPrompt: string;
    sourceImage: FileData | null;
    referenceImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    resultImages: string[];
    numberOfImages: number;
    renderMode: 'top-down' | 'perspective';
    planType: 'interior' | 'exterior';
}

export interface MaterialSwapperState {
    prompt: string;
    sceneImage: FileData | null;
    materialImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    resultImages: string[];
    numberOfImages: number;
}

export interface UpscaleState {
    sourceImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    upscaledImages: string[];
    numberOfImages: number;
}

export interface MoodboardGeneratorState {
    prompt: string;
    sourceImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    resultImages: string[];
    numberOfImages: number;
    aspectRatio: AspectRatio;
    mode: 'moodboardToScene' | 'sceneToMoodboard';
}

export interface StagingState {
    prompt: string;
    sceneImage: FileData | null;
    objectImages: FileData[];
    isLoading: boolean;
    error: string | null;
    resultImages: string[];
    numberOfImages: number;
}

export interface PromptSuggesterState {
    sourceImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    suggestions: Record<string, string[]> | null;
    selectedSubject: string;
    numberOfSuggestions: number;
    customInstruction: string;
}

export interface PromptEnhancerState {
    sourceImage: FileData | null;
    customNeeds: string;
    isLoading: boolean;
    error: string | null;
    resultPrompt: string | null;
}

export interface AITechnicalDrawingsState {
    sourceImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    resultImage: string | null;
    drawingType: 'floor-plan' | 'elevation' | 'section';
    detailLevel: 'basic' | 'detailed' | 'annotated' | 'terrain';
}

export interface SketchConverterState {
    sourceImage: FileData | null;
    isLoading: boolean;
    error: string | null;
    resultImage: string | null;
    sketchStyle: 'pencil' | 'charcoal' | 'watercolor';
    detailLevel: 'low' | 'medium' | 'high';
}

export interface LuBanRulerState {
    width: string;
    height: string;
    checkDimension: 'width' | 'height';
}

export interface FengShuiState {
    name: string;
    birthDay: string;
    birthMonth: string;
    birthYear: string;
    gender: 'male' | 'female';
    analysisType: string;
    floorPlanImage: FileData | null;
    houseDirection: string;
    isLoading: boolean;
    error: string | null;
    resultImage: string | null;
    analysisText: string | null;
    // New fields for Am Trach
    deathDay: string;
    deathMonth: string;
    deathYear: string;
    deathHour: string;
    spouseName: string;
    spouseBirthYear: string;
    eldestChildName: string;
    eldestChildBirthYear: string;
    graveDirection: string;
    terrainDescription: string;
    // New fields for Loan Dau
    latitude: number | null;
    longitude: number | null;
    // New fields for Duong Trach
    kitchenDirection: string;
    bedroomDirection: string;
    // New field for Ngay gio tot
    eventType: string;
    // New field for Van Khan
    vanKhanType: string;
}


// Khởi tạo giá trị mặc định cho trạng thái của tất cả công cụ
export const initialToolStates = {
    [Tool.ArchitecturalRendering]: {
        style: 'none',
        context: 'none',
        lighting: 'none',
        weather: 'none',
        buildingType: 'none',
        customPrompt: 'Biến thành ảnh chụp thực tế nhà ở',
        referenceImage: null,
        sourceImage: null,
        isLoading: false,
        isUpscaling: false,
        error: null,
        resultImages: [],
        upscaledImage: null,
        numberOfImages: 1,
        aspectRatio: '4:3',
    } as ImageGeneratorState,
    [Tool.InteriorRendering]: {
        style: 'none',
        roomType: 'none',
        lighting: 'none',
        colorPalette: 'none',
        customPrompt: 'Biến thành ảnh chụp thực tế không gian nội thất',
        referenceImage: null,
        sourceImage: null,
        isLoading: false,
        isUpscaling: false,
        error: null,
        resultImages: [],
        upscaledImage: null,
        numberOfImages: 1,
        aspectRatio: '4:3',
    } as InteriorGeneratorState,
    [Tool.UrbanPlanning]: {
        viewType: 'none',
        density: 'none',
        lighting: 'none',
        customPrompt: 'Render một khu đô thị ven sông, có nhiều cây xanh, các toà nhà hiện đại và một cây cầu đi bộ.',
        referenceImage: null,
        sourceImage: null,
        isLoading: false,
        isUpscaling: false,
        error: null,
        resultImages: [],
        upscaledImage: null,
        numberOfImages: 1,
        aspectRatio: '16:9',
    } as UrbanPlanningState,
    [Tool.LandscapeRendering]: {
        gardenStyle: 'none',
        timeOfDay: 'none',
        features: 'none',
        customPrompt: 'Render một sân vườn nhỏ phía sau nhà, có lối đi bằng đá, nhiều hoa và một bộ bàn ghế nhỏ.',
        referenceImage: null,
        sourceImage: null,
        isLoading: false,
        isUpscaling: false,
        error: null,
        resultImages: [],
        upscaledImage: null,
        numberOfImages: 1,
        aspectRatio: '16:9',
    } as LandscapeRenderingState,
    [Tool.FloorPlan]: {
        prompt: 'Render theo phong cách Scandinavian với nội thất gỗ sồi, tường trắng và nhiều ánh sáng tự nhiên.',
        layoutPrompt: '',
        sourceImage: null,
        referenceImage: null,
        isLoading: false,
        error: null,
        resultImages: [],
        numberOfImages: 1,
        renderMode: 'top-down',
        planType: 'interior',
    } as FloorPlanState,
    [Tool.Renovation]: {
        prompt: 'Cải tạo mặt tiền ngôi nhà này theo phong cách hiện đại, tối giản. Sử dụng vật liệu gỗ, kính và bê tông. Thêm nhiều cây xanh xung quanh.',
        sourceImage: null,
        referenceImage: null,
        maskImage: null,
        isLoading: false,
        error: null,
        renovatedImages: [],
        numberOfImages: 1,
        aspectRatio: '4:3',
    } as RenovationState,
    [Tool.ViewSync]: {
        sourceImage: null,
        directionImage: null,
        isLoading: false,
        error: null,
        resultImages: [],
        numberOfImages: 1,
        sceneType: 'exterior',
        aspectRatio: '4:3',
        customPrompt: '',
        selectedPerspective: 'default',
        selectedAtmosphere: 'default',
        selectedFraming: 'none',
        selectedInteriorAngle: 'default',
    } as ViewSyncState,
    [Tool.VirtualTour]: {
        sourceImage: null,
        currentTourImage: null,
        isLoading: false,
        error: null,
        tourStepSize: 30,
        tourHistory: [],
    } as VirtualTourState,
     [Tool.PromptSuggester]: {
        sourceImage: null,
        isLoading: false,
        error: null,
        suggestions: null,
        selectedSubject: 'all',
        numberOfSuggestions: 5,
        customInstruction: '',
    } as PromptSuggesterState,
    [Tool.PromptEnhancer]: {
        sourceImage: null,
        customNeeds: 'Tạo một prompt chi tiết, chuyên nghiệp cho việc render kiến trúc, tập trung vào phong cách hiện đại, ánh sáng ban ngày và vật liệu tự nhiên.',
        isLoading: false,
        error: null,
        resultPrompt: null,
    } as PromptEnhancerState,
    [Tool.MaterialSwap]: {
        prompt: 'Thay thế sàn trong ảnh chính bằng vật liệu gỗ từ ảnh tham khảo.',
        sceneImage: null,
        materialImage: null,
        isLoading: false,
        error: null,
        resultImages: [],
        numberOfImages: 1,
    } as MaterialSwapperState,
    [Tool.Upscale]: {
        sourceImage: null,
        isLoading: false,
        error: null,
        upscaledImages: [],
        numberOfImages: 1,
    } as UpscaleState,
    [Tool.Moodboard]: {
        prompt: 'Một phòng khách hiện đại và rộng rãi.',
        sourceImage: null,
        isLoading: false,
        error: null,
        resultImages: [],
        numberOfImages: 1,
        aspectRatio: '4:3',
        mode: 'moodboardToScene',
    } as MoodboardGeneratorState,
    [Tool.VideoGeneration]: {
        prompt: 'Tạo video time-lapse cho thấy tòa nhà chuyển từ cảnh ban ngày nắng đẹp sang cảnh ban đêm được chiếu sáng đẹp mắt.',
        startImage: null,
        isLoading: false,
        loadingMessage: "Đang khởi tạo các photon ánh sáng...",
        error: null,
        generatedVideoUrl: null,
        mode: 'exterior',
    } as VideoGeneratorState,
    [Tool.ImageEditing]: {
        prompt: 'Thêm một ban công sắt nghệ thuật vào cửa sổ tầng hai.',
        sourceImage: null,
        maskImage: null,
        referenceImages: [],
        isLoading: false,
        error: null,
        resultImages: [],
        numberOfImages: 1,
    } as ImageEditorState,
    [Tool.Staging]: {
        prompt: 'Đặt các đồ vật này vào không gian một cách hợp lý và tự nhiên.',
        sceneImage: null,
        objectImages: [],
        isLoading: false,
        error: null,
        resultImages: [],
        numberOfImages: 1,
    } as StagingState,
    [Tool.AITechnicalDrawings]: {
        sourceImage: null,
        isLoading: false,
        error: null,
        resultImage: null,
        drawingType: 'floor-plan',
        detailLevel: 'basic',
    } as AITechnicalDrawingsState,
    [Tool.SketchConverter]: {
        sourceImage: null,
        isLoading: false,
        error: null,
        resultImage: null,
        sketchStyle: 'pencil',
        detailLevel: 'medium',
    } as SketchConverterState,
    [Tool.LuBanRuler]: {
        width: '1940',
        height: '810',
        checkDimension: 'width',
    } as LuBanRulerState,
    [Tool.FengShui]: {
        name: '',
        birthDay: '1',
        birthMonth: '1',
        birthYear: '',
        gender: 'male',
        analysisType: 'bat-trach',
        floorPlanImage: null,
        houseDirection: 'bac-kham',
        isLoading: false,
        error: null,
        resultImage: null,
        analysisText: null,
        deathDay: '',
        deathMonth: '',
        deathYear: '',
        deathHour: 'ty',
        spouseName: '',
        spouseBirthYear: '',
        eldestChildName: '',
        eldestChildBirthYear: '',
        graveDirection: 'bac-kham',
        terrainDescription: '',
        latitude: null,
        longitude: null,
        kitchenDirection: 'dong-nam-ton',
        bedroomDirection: 'dong-chan',
        eventType: 'dong-tho',
        vanKhanType: 'dong-tho',
    } as FengShuiState,
    [Tool.History]: {}, // History doesn't need persistent state in this way
};

export type ToolStates = typeof initialToolStates;