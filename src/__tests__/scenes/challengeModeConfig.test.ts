import { TITLE_BUTTONS } from '../../scenes/titleConfig';
import { SceneKey } from '../../scenes/sceneKeys';
import { GameMode } from '../../types/GameMode';
import {
  getCharacterSelectButtons,
  getChallengeHeader,
} from '../../scenes/characterSelectConfig';

describe('TITLE_BUTTONS 挑戦モード遷移先', () => {
  it('挑戦モードボタンの遷移先が CHARACTER_SELECT であること', () => {
    const button = TITLE_BUTTONS.find((b) => b.mode === GameMode.CHALLENGE)!;
    expect(button).toBeDefined();
    expect(button.targetScene).toBe(SceneKey.CHARACTER_SELECT);
  });
});

describe('getCharacterSelectButtons (CHALLENGE)', () => {
  it('CHALLENGEモードで2つのボタンが返されること', () => {
    const buttons = getCharacterSelectButtons(undefined, GameMode.CHALLENGE);
    expect(buttons).toHaveLength(2);
  });

  it('「決定」ボタンがBATTLEへの遷移であること', () => {
    const buttons = getCharacterSelectButtons(undefined, GameMode.CHALLENGE);
    const confirmBtn = buttons.find((b) => b.action === 'confirm');
    expect(confirmBtn).toBeDefined();
    expect(confirmBtn!.label).toBe('決定');
    expect(confirmBtn!.targetScene).toBe(SceneKey.BATTLE);
  });

  it('「タイトルへ」ボタンがTITLEへの遷移であること', () => {
    const buttons = getCharacterSelectButtons(undefined, GameMode.CHALLENGE);
    const backBtn = buttons.find((b) => b.action === 'back');
    expect(backBtn).toBeDefined();
    expect(backBtn!.label).toBe('タイトルへ');
    expect(backBtn!.targetScene).toBe(SceneKey.TITLE);
  });
});

describe('getChallengeHeader', () => {
  it('ステージ1のヘッダーが正しいこと', () => {
    const header = getChallengeHeader(1);
    expect(header).toContain('1');
  });

  it('ステージ8のヘッダーが正しいこと', () => {
    const header = getChallengeHeader(8);
    expect(header).toContain('8');
  });

  it('ヘッダーが空文字列でないこと', () => {
    for (let i = 1; i <= 8; i++) {
      expect(getChallengeHeader(i).length).toBeGreaterThan(0);
    }
  });
});
