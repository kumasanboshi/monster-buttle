import {
  INITIAL_MONSTER_ID,
  UNLOCK_ORDER,
  getUnlockedMonsterIds,
  isMonsterUnlocked,
  GRID_COLS,
  GRID_ROWS,
  THEME_COLORS,
  CHARACTER_SELECT_BUTTONS,
  getCharacterSelectButtons,
  CHARACTER_SELECT_HEADERS,
} from '../../scenes/characterSelectConfig';
import { MONSTER_DATABASE } from '../../constants/monsters';
import { SceneKey } from '../../scenes/sceneKeys';
import { getAvailableTransitions } from '../../scenes/sceneTransitions';
import { GameMode } from '../../types/GameMode';

describe('INITIAL_MONSTER_ID', () => {
  it('初期キャラが zaag（レイン）であること', () => {
    expect(INITIAL_MONSTER_ID).toBe('zaag');
  });

  it('初期キャラがMONSTER_DATABASEに存在すること', () => {
    const monster = MONSTER_DATABASE.find((m) => m.id === INITIAL_MONSTER_ID);
    expect(monster).toBeDefined();
  });
});

describe('UNLOCK_ORDER', () => {
  it('7体の解放順序が定義されていること（初期キャラを除く）', () => {
    expect(UNLOCK_ORDER).toHaveLength(7);
  });

  it('初期キャラ（zaag）が含まれていないこと', () => {
    expect(UNLOCK_ORDER).not.toContain('zaag');
  });

  it('PROJECT.mdのステージ順と一致すること', () => {
    expect(UNLOCK_ORDER[0]).toBe('gardan');
    expect(UNLOCK_ORDER[1]).toBe('morsu');
    expect(UNLOCK_ORDER[2]).toBe('roona');
    expect(UNLOCK_ORDER[3]).toBe('balga');
    expect(UNLOCK_ORDER[4]).toBe('zephyr');
    expect(UNLOCK_ORDER[5]).toBe('graon');
    expect(UNLOCK_ORDER[6]).toBe('igna');
  });

  it('すべてのIDがMONSTER_DATABASEに存在すること', () => {
    for (const id of UNLOCK_ORDER) {
      const monster = MONSTER_DATABASE.find((m) => m.id === id);
      expect(monster).toBeDefined();
    }
  });

  it('初期キャラとUNLOCK_ORDERでMONSTER_DATABASEの全8体を網羅すること', () => {
    const allIds = [INITIAL_MONSTER_ID, ...UNLOCK_ORDER];
    expect(allIds).toHaveLength(8);
    for (const monster of MONSTER_DATABASE) {
      expect(allIds).toContain(monster.id);
    }
  });
});

describe('getUnlockedMonsterIds', () => {
  it('ステージ0クリアで初期キャラのみ解放されていること', () => {
    const unlocked = getUnlockedMonsterIds(0);
    expect(unlocked).toEqual(['zaag']);
  });

  it('ステージ1クリアで2体解放されていること', () => {
    const unlocked = getUnlockedMonsterIds(1);
    expect(unlocked).toHaveLength(2);
    expect(unlocked).toContain('zaag');
    expect(unlocked).toContain('gardan');
  });

  it('ステージ3クリアで4体解放されていること', () => {
    const unlocked = getUnlockedMonsterIds(3);
    expect(unlocked).toHaveLength(4);
    expect(unlocked).toContain('zaag');
    expect(unlocked).toContain('gardan');
    expect(unlocked).toContain('morsu');
    expect(unlocked).toContain('roona');
  });

  it('全ステージクリアで全8体解放されていること', () => {
    const unlocked = getUnlockedMonsterIds(7);
    expect(unlocked).toHaveLength(8);
    for (const monster of MONSTER_DATABASE) {
      expect(unlocked).toContain(monster.id);
    }
  });

  it('ステージ数がUNLOCK_ORDER以上でも全8体であること', () => {
    const unlocked = getUnlockedMonsterIds(100);
    expect(unlocked).toHaveLength(8);
  });

  it('負の値では初期キャラのみ返すこと', () => {
    const unlocked = getUnlockedMonsterIds(-1);
    expect(unlocked).toEqual(['zaag']);
  });
});

describe('isMonsterUnlocked', () => {
  it('初期キャラはステージ0でも解放済みであること', () => {
    expect(isMonsterUnlocked('zaag', 0)).toBe(true);
  });

  it('ステージ1クリア前はgardanは未解放であること', () => {
    expect(isMonsterUnlocked('gardan', 0)).toBe(false);
  });

  it('ステージ1クリア後はgardanが解放されること', () => {
    expect(isMonsterUnlocked('gardan', 1)).toBe(true);
  });

  it('存在しないIDは常に未解放であること', () => {
    expect(isMonsterUnlocked('nonexistent', 100)).toBe(false);
  });
});

describe('GRID_COLS / GRID_ROWS', () => {
  it('グリッドが8体分のセルを持つこと', () => {
    expect(GRID_COLS * GRID_ROWS).toBe(8);
  });

  it('4列2行のグリッドであること', () => {
    expect(GRID_COLS).toBe(4);
    expect(GRID_ROWS).toBe(2);
  });
});

describe('THEME_COLORS', () => {
  it('全8魂格のテーマカラーが定義されていること', () => {
    for (const monster of MONSTER_DATABASE) {
      expect(THEME_COLORS[monster.id]).toBeDefined();
      expect(typeof THEME_COLORS[monster.id]).toBe('string');
    }
  });

  it('カラーコードが有効な形式であること', () => {
    for (const color of Object.values(THEME_COLORS)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('CHARACTER_SELECT_BUTTONS', () => {
  it('決定ボタンが定義されていること', () => {
    const confirmButton = CHARACTER_SELECT_BUTTONS.find((b) => b.action === 'confirm');
    expect(confirmButton).toBeDefined();
    expect(confirmButton!.label).toBe('決定');
    expect(confirmButton!.targetScene).toBe(SceneKey.BATTLE);
  });

  it('戻るボタンが定義されていること', () => {
    const backButton = CHARACTER_SELECT_BUTTONS.find((b) => b.action === 'back');
    expect(backButton).toBeDefined();
    expect(backButton!.label).toBe('戻る');
    expect(backButton!.targetScene).toBe(SceneKey.MODE_SELECT);
  });

  it('すべてのボタンの targetScene が CHARACTER_SELECT から有効な遷移先であること', () => {
    const validTransitions = getAvailableTransitions(SceneKey.CHARACTER_SELECT);
    for (const button of CHARACTER_SELECT_BUTTONS) {
      expect(validTransitions).toContain(button.targetScene);
    }
  });
});

describe('CHARACTER_SELECT_HEADERS', () => {
  it('player用ヘッダーが「キャラ選択（自分）」であること', () => {
    expect(CHARACTER_SELECT_HEADERS.player).toBe('キャラ選択（自分）');
  });

  it('opponent用ヘッダーが「キャラ選択（相手）」であること', () => {
    expect(CHARACTER_SELECT_HEADERS.opponent).toBe('キャラ選択（相手）');
  });

  it('default用ヘッダーが「キャラ選択」であること', () => {
    expect(CHARACTER_SELECT_HEADERS.default).toBe('キャラ選択');
  });
});

describe('getCharacterSelectButtons', () => {
  describe('FREE_CPU - step=player', () => {
    it('決定ボタンの遷移先がCHARACTER_SELECTであること', () => {
      const buttons = getCharacterSelectButtons('player', GameMode.FREE_CPU);
      const confirm = buttons.find((b) => b.action === 'confirm');
      expect(confirm).toBeDefined();
      expect(confirm!.targetScene).toBe(SceneKey.CHARACTER_SELECT);
    });

    it('戻るボタンの遷移先がTITLEであること', () => {
      const buttons = getCharacterSelectButtons('player', GameMode.FREE_CPU);
      const back = buttons.find((b) => b.action === 'back');
      expect(back).toBeDefined();
      expect(back!.targetScene).toBe(SceneKey.TITLE);
    });

    it('ランダムボタンが含まれないこと', () => {
      const buttons = getCharacterSelectButtons('player', GameMode.FREE_CPU);
      const random = buttons.find((b) => b.action === 'random');
      expect(random).toBeUndefined();
    });
  });

  describe('FREE_CPU - step=opponent', () => {
    it('決定ボタンの遷移先がDIFFICULTY_SELECTであること', () => {
      const buttons = getCharacterSelectButtons('opponent', GameMode.FREE_CPU);
      const confirm = buttons.find((b) => b.action === 'confirm');
      expect(confirm).toBeDefined();
      expect(confirm!.targetScene).toBe(SceneKey.DIFFICULTY_SELECT);
    });

    it('戻るボタンの遷移先がCHARACTER_SELECTであること', () => {
      const buttons = getCharacterSelectButtons('opponent', GameMode.FREE_CPU);
      const back = buttons.find((b) => b.action === 'back');
      expect(back).toBeDefined();
      expect(back!.targetScene).toBe(SceneKey.CHARACTER_SELECT);
    });

    it('ランダムボタンが含まれること', () => {
      const buttons = getCharacterSelectButtons('opponent', GameMode.FREE_CPU);
      const random = buttons.find((b) => b.action === 'random');
      expect(random).toBeDefined();
      expect(random!.label).toBe('ランダム');
      expect(random!.targetScene).toBe(SceneKey.DIFFICULTY_SELECT);
    });
  });

  describe('モード未指定（デフォルト）', () => {
    it('デフォルトのCHARACTER_SELECT_BUTTONSと同じボタンを返すこと', () => {
      const buttons = getCharacterSelectButtons();
      expect(buttons).toEqual(CHARACTER_SELECT_BUTTONS);
    });
  });

  it('すべてのボタンの targetScene が CHARACTER_SELECT から有効な遷移先であること', () => {
    const validTransitions = getAvailableTransitions(SceneKey.CHARACTER_SELECT);
    const allButtons = [
      ...getCharacterSelectButtons('player', GameMode.FREE_CPU),
      ...getCharacterSelectButtons('opponent', GameMode.FREE_CPU),
    ];
    for (const button of allButtons) {
      expect(validTransitions).toContain(button.targetScene);
    }
  });
});
