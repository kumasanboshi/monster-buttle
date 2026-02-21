import { BattleResultType } from '../types/BattleState';
import { getMonsterById } from '../constants/monsters';

/** シェアテキスト生成に必要な入力 */
export interface ShareTextInput {
  resultType: BattleResultType;
  monsterId?: string;
  turnCount: number;
}

/**
 * シェア用テキストを生成する純粋関数
 */
export function buildShareText(input: ShareTextInput): string {
  const { resultType, monsterId, turnCount } = input;

  const monster = monsterId ? getMonsterById(monsterId) : undefined;
  const monsterPart = monster ? `「${monster.name}」で` : '';

  switch (resultType) {
    case BattleResultType.PLAYER1_WIN:
      return `${monsterPart}勝った！ ${turnCount}ターンの死闘だった。\n#モンスター対戦`;
    case BattleResultType.PLAYER2_WIN:
      return `${monsterPart}挑んだが負けた... ${turnCount}ターンの激戦。\n#モンスター対戦`;
    case BattleResultType.DRAW:
      return `${monsterPart}引き分け！ ${turnCount}ターンの接戦だった。\n#モンスター対戦`;
  }
}

/**
 * X（Twitter）のシェアURLを生成する純粋関数
 */
export function buildShareUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
