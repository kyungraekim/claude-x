// Pixel 단위 정의
export interface AnsiPixel {
  fg: [number, number, number]; // RGB
  bg?: [number, number, number];
}

// 한 줄 = 픽셀 배열
export type AnsiPixelRow = AnsiPixel[];

// 이미지 = 줄 배열
export type AnsiImage = AnsiPixelRow[];

// 애니메이션 이미지 = 프레임 배열
export type AnimatedAnsiImage = AnsiImage[];
