import { AILevel } from '../ai/types';

/** CPU難易度オプション */
export interface CpuDifficultyOption {
  /** 表示ラベル */
  label: string;
  /** 対応するAIレベル */
  aiLevel: AILevel;
}

/** CPU難易度の選択肢（4段階） */
export const CPU_DIFFICULTY_OPTIONS: CpuDifficultyOption[] = [
  { label: '弱い', aiLevel: AILevel.LV1 },
  { label: '普通', aiLevel: AILevel.LV2 },
  { label: '強い', aiLevel: AILevel.LV4 },
  { label: '最強', aiLevel: AILevel.LV5 },
];

/** 難易度選択画面レイアウト定数 */
export interface DifficultySelectLayoutConfig {
  titleY: number;
  buttonStartY: number;
  buttonSpacing: number;
  backButtonY: number;
}

/** 難易度選択画面レイアウト */
export const DIFFICULTY_SELECT_LAYOUT: DifficultySelectLayoutConfig = {
  titleY: 80,
  buttonStartY: 200,
  buttonSpacing: 70,
  backButtonY: 520,
};

/** 難易度選択画面ラベル */
export const DIFFICULTY_SELECT_LABELS = {
  title: 'CPU難易度選択',
  back: '戻る',
} as const;
