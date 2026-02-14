import {
  TITLE_TEXT,
  TITLE_BUTTONS,
  TitleButtonConfig,
} from '../../scenes/titleConfig';
import { SceneKey } from '../../scenes/sceneKeys';
import { getAvailableTransitions } from '../../scenes/sceneTransitions';
import { GameMode } from '../../types/GameMode';

describe('TITLE_TEXT', () => {
  it('ゲームタイトルが定義されていること', () => {
    expect(TITLE_TEXT).toBeDefined();
    expect(typeof TITLE_TEXT).toBe('string');
    expect(TITLE_TEXT.length).toBeGreaterThan(0);
  });
});

describe('TITLE_BUTTONS', () => {
  it('4つのボタンが定義されていること', () => {
    expect(TITLE_BUTTONS).toHaveLength(4);
  });

  it('すべてのボタンに必須プロパティがあること', () => {
    for (const button of TITLE_BUTTONS) {
      expect(button.label).toBeDefined();
      expect(typeof button.label).toBe('string');
      expect(button.label.length).toBeGreaterThan(0);
      expect(button.targetScene).toBeDefined();
    }
  });

  describe('挑戦モードボタン', () => {
    let button: TitleButtonConfig;

    beforeEach(() => {
      button = TITLE_BUTTONS.find((b) => b.mode === GameMode.CHALLENGE)!;
    });

    it('挑戦モードボタンが存在すること', () => {
      expect(button).toBeDefined();
    });

    it('ラベルが「挑戦モード」であること', () => {
      expect(button.label).toBe('挑戦モード');
    });

    it('遷移先が CHARACTER_SELECT であること', () => {
      expect(button.targetScene).toBe(SceneKey.CHARACTER_SELECT);
    });

    it('モードが CHALLENGE であること', () => {
      expect(button.mode).toBe(GameMode.CHALLENGE);
    });
  });

  describe('自由対戦（CPU）ボタン', () => {
    let button: TitleButtonConfig;

    beforeEach(() => {
      button = TITLE_BUTTONS.find((b) => b.mode === GameMode.FREE_CPU)!;
    });

    it('自由対戦（CPU）ボタンが存在すること', () => {
      expect(button).toBeDefined();
    });

    it('ラベルが「自由対戦（CPU）」であること', () => {
      expect(button.label).toBe('自由対戦（CPU）');
    });

    it('遷移先が CHARACTER_SELECT であること', () => {
      expect(button.targetScene).toBe(SceneKey.CHARACTER_SELECT);
    });

    it('モードが FREE_CPU であること', () => {
      expect(button.mode).toBe(GameMode.FREE_CPU);
    });
  });

  describe('自由対戦（ローカル）ボタン', () => {
    let button: TitleButtonConfig;

    beforeEach(() => {
      button = TITLE_BUTTONS.find((b) => b.mode === GameMode.FREE_LOCAL)!;
    });

    it('自由対戦（ローカル）ボタンが存在すること', () => {
      expect(button).toBeDefined();
    });

    it('ラベルが「自由対戦（ローカル）」であること', () => {
      expect(button.label).toBe('自由対戦（ローカル）');
    });

    it('遷移先が MODE_SELECT であること', () => {
      expect(button.targetScene).toBe(SceneKey.MODE_SELECT);
    });

    it('モードが FREE_LOCAL であること', () => {
      expect(button.mode).toBe(GameMode.FREE_LOCAL);
    });
  });

  describe('設定ボタン', () => {
    let button: TitleButtonConfig;

    beforeEach(() => {
      button = TITLE_BUTTONS.find((b) => b.targetScene === SceneKey.SETTINGS)!;
    });

    it('設定ボタンが存在すること', () => {
      expect(button).toBeDefined();
    });

    it('ラベルが「設定」であること', () => {
      expect(button.label).toBe('設定');
    });

    it('遷移先が SETTINGS であること', () => {
      expect(button.targetScene).toBe(SceneKey.SETTINGS);
    });

    it('モードが undefined であること（モード選択ではない）', () => {
      expect(button.mode).toBeUndefined();
    });
  });

  it('ボタンの並び順が仕様通りであること', () => {
    expect(TITLE_BUTTONS[0].label).toBe('挑戦モード');
    expect(TITLE_BUTTONS[1].label).toBe('自由対戦（CPU）');
    expect(TITLE_BUTTONS[2].label).toBe('自由対戦（ローカル）');
    expect(TITLE_BUTTONS[3].label).toBe('設定');
  });

  it('すべてのボタンの targetScene が TITLE から有効な遷移先であること', () => {
    const validTransitions = getAvailableTransitions(SceneKey.TITLE);
    for (const button of TITLE_BUTTONS) {
      expect(validTransitions).toContain(button.targetScene);
    }
  });
});
