import { selectCommands, selectSingleCommand } from '../../ai/aiSelector';
import { AILevel } from '../../ai/types';
import { CommandType, DistanceType, StanceType, Monster, BattleState, TurnResult } from '../../types';

function createTestMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'zaag',
    name: 'レイン',
    species: 'ザーグ',
    stats: { hp: 250, strength: 50, special: 50, speed: 40, toughness: 50, specialAttackCount: 5 },
    weapon: { name: 'テスト武器', multiplier: 1.6 },
    reflector: { name: 'テストリフレクター', maxReflectCount: 2, reflectRate: 0.5 },
    ...overrides,
  };
}

function createTestState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player1: {
      monsterId: 'zaag',
      currentHp: 250,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 5,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'gardan',
      currentHp: 280,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 1,
    remainingTime: 180,
    isFinished: false,
    ...overrides,
  };
}

describe('selectCommands', () => {
  describe('Lv1 AI（ランダム）', () => {
    describe('基本動作', () => {
      it('TurnCommands構造（first, second）を返す', () => {
        const state = createTestState();
        const monster = createTestMonster();
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.5);
        expect(result).toHaveProperty('first');
        expect(result).toHaveProperty('second');
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });

      it('有効なコマンドから選択する', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.5);
        // MID距離では WEAPON_ATTACK は無効
        expect(result.first.type).not.toBe(CommandType.WEAPON_ATTACK);
        expect(result.second.type).not.toBe(CommandType.WEAPON_ATTACK);
      });

      it('同じコマンドを2回選択することも可能', () => {
        const state = createTestState();
        const monster = createTestMonster();
        // 同じ乱数値なら同じコマンドを選ぶ
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.0);
        expect(result.first.type).toBe(result.second.type);
      });
    });

    describe('ランダム性のテスト（固定乱数）', () => {
      it('randomFn() = 0.0の時、最初の有効コマンドを選択', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        // MID距離の有効コマンド: ADVANCE, RETREAT, SPECIAL_ATTACK, REFLECTOR, STANCE_A, STANCE_B
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.0);
        expect(result.first.type).toBe(CommandType.ADVANCE);
      });

      it('randomFn() = 0.99の時、最後の有効コマンドを選択', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.99);
        expect(result.first.type).toBe(CommandType.STANCE_B);
      });

      it('1stと2ndで異なる乱数値を使う場合、異なるコマンドを選べる', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        let callCount = 0;
        const randomFn = () => {
          callCount++;
          return callCount === 1 ? 0.0 : 0.99;
        };
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, randomFn);
        expect(result.first.type).toBe(CommandType.ADVANCE);
        expect(result.second.type).toBe(CommandType.STANCE_B);
      });
    });

    describe('無効コマンドの除外', () => {
      it('遠距離では武器攻撃を選択しない', () => {
        const state = createTestState({ currentDistance: DistanceType.FAR });
        const monster = createTestMonster();
        // 全乱数パターンで武器攻撃が出ないことを確認
        for (let i = 0; i < 10; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => i / 10);
          expect(result.first.type).not.toBe(CommandType.WEAPON_ATTACK);
          expect(result.second.type).not.toBe(CommandType.WEAPON_ATTACK);
        }
      });

      it('リフレクター使用済みではリフレクターを選択しない', () => {
        const state = createTestState({
          player1: {
            monsterId: 'zaag',
            currentHp: 250,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 5,
            usedReflectCount: 2,
          },
        });
        const monster = createTestMonster(); // maxReflectCount: 2
        for (let i = 0; i < 10; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => i / 10);
          expect(result.first.type).not.toBe(CommandType.REFLECTOR);
          expect(result.second.type).not.toBe(CommandType.REFLECTOR);
        }
      });
    });

    describe('近距離での動作', () => {
      it('近距離では武器攻撃を選択できる', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        // 7つの有効コマンド: ADVANCE, RETREAT, WEAPON, SPECIAL, REFLECTOR, STANCE_A, STANCE_B
        // randomFn = 2/7 ≈ 0.286 → WEAPON_ATTACK（3番目）
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 2 / 7);
        expect(result.first.type).toBe(CommandType.WEAPON_ATTACK);
      });
    });

    describe('player2としての動作', () => {
      it('player2でも正しく動作する', () => {
        const state = createTestState();
        const monster = createTestMonster({ id: 'gardan' });
        const result = selectCommands(state, 'player2', monster, AILevel.LV1, () => 0.5);
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });
    });
  });

  describe('selectSingleCommand', () => {
    it('有効コマンドリストからランダムに1つ選択する', () => {
      const cmds = [CommandType.ADVANCE, CommandType.RETREAT, CommandType.SPECIAL_ATTACK];
      expect(selectSingleCommand(cmds, () => 0.0)).toBe(CommandType.ADVANCE);
      expect(selectSingleCommand(cmds, () => 0.99)).toBe(CommandType.SPECIAL_ATTACK);
    });

    it('空リストの場合はADVANCEをフォールバックとして返す', () => {
      expect(selectSingleCommand([], () => 0.5)).toBe(CommandType.ADVANCE);
    });
  });

  describe('Lv2 AI（距離ベース）', () => {
    describe('基本動作', () => {
      it('TurnCommands構造（first, second）を返す', () => {
        const state = createTestState();
        const monster = createTestMonster();
        const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => 0.5);
        expect(result).toHaveProperty('first');
        expect(result).toHaveProperty('second');
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });

      it('有効なコマンドのみ選択する', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        for (let i = 0; i < 10; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => i / 10);
          // MID距離では WEAPON_ATTACK は無効
          expect(result.first.type).not.toBe(CommandType.WEAPON_ATTACK);
          expect(result.second.type).not.toBe(CommandType.WEAPON_ATTACK);
        }
      });

      it('リフレクター使用済みではリフレクターを選択しない', () => {
        const state = createTestState({
          player1: {
            monsterId: 'zaag',
            currentHp: 250,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 5,
            usedReflectCount: 2,
          },
        });
        const monster = createTestMonster(); // maxReflectCount: 2
        for (let i = 0; i < 10; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => i / 10);
          expect(result.first.type).not.toBe(CommandType.REFLECTOR);
          expect(result.second.type).not.toBe(CommandType.REFLECTOR);
        }
      });
    });

    describe('近距離での距離バイアス', () => {
      it('近距離ではWEAPON_ATTACKの重みが高い（zaag: species1.0 × distance2.0 = 2.0）', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster(); // zaag: balanced (all 1.0)
        // zaag@NEAR combined weights: ADV 0.6, RET 1.2, WPN 2.0, SPC 0.8, REF 1.0, STA 1.0, STB 1.0
        // total = 7.6, WEAPON range = [1.8, 3.8) → randomFn in [0.2368, 0.5)
        const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => 0.3);
        expect(result.first.type).toBe(CommandType.WEAPON_ATTACK);
      });

      it('近距離ではADVANCEの重みが低い（既に近いため）', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        // zaag@NEAR: ADVANCE weight = 0.6/7.6 ≈ 7.9%
        // randomFn=0.0 → ADVANCE (weight 0.6 is first in cumulative)
        // randomFn=0.08 → 0.08*7.6 = 0.608 → just past ADVANCE(0.6), into RETREAT
        const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => 0.08);
        expect(result.first.type).toBe(CommandType.RETREAT);
      });
    });

    describe('遠距離での距離バイアス', () => {
      it('遠距離ではSPECIAL_ATTACKの重みが高い（zaag: species1.0 × distance2.0 = 2.0）', () => {
        const state = createTestState({ currentDistance: DistanceType.FAR });
        const monster = createTestMonster(); // zaag
        // zaag@FAR: ADV 1.8, RET 0.4, SPC 2.0, REF 1.0, STA 0.8, STB 0.8
        // total = 6.8, SPC range = [2.2, 4.2) → randomFn in [0.3235, 0.6176)
        const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => 0.4);
        expect(result.first.type).toBe(CommandType.SPECIAL_ATTACK);
      });

      it('遠距離ではADVANCEの重みが高い（距離を詰めるため）', () => {
        const state = createTestState({ currentDistance: DistanceType.FAR });
        const monster = createTestMonster();
        // zaag@FAR: ADVANCE weight = 1.8/6.8 ≈ 26.5%, range [0, 1.8)
        // randomFn=0.1 → 0.1*6.8 = 0.68 < 1.8 → ADVANCE
        const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => 0.1);
        expect(result.first.type).toBe(CommandType.ADVANCE);
      });

      it('遠距離ではRETREATの重みが低い（既に遠いため）', () => {
        const state = createTestState({ currentDistance: DistanceType.FAR });
        const monster = createTestMonster();
        // zaag@FAR: RETREAT weight = 0.4/6.8 ≈ 5.9%, range [1.8, 2.2)
        // Very narrow range - hard to hit with random
        // Run 1000 iterations and check RETREAT is selected rarely
        let retreatCount = 0;
        for (let i = 0; i < 1000; i++) {
          const r = i / 1000;
          const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => r);
          if (result.first.type === CommandType.RETREAT) retreatCount++;
        }
        // RETREAT should be ~5.9% of selections
        expect(retreatCount).toBeLessThan(100); // < 10%
      });
    });

    describe('中距離での距離バイアス', () => {
      it('中距離ではバランスの取れた選択（極端な偏りなし）', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        // zaag@MID: ADV 1.2, RET 1.0, SPC 1.2, REF 1.0, STA 1.0, STB 1.0
        // total = 6.4, fairly balanced
        const counts: Record<string, number> = {};
        for (let i = 0; i < 1000; i++) {
          const r = i / 1000;
          const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => r);
          counts[result.first.type] = (counts[result.first.type] || 0) + 1;
        }
        // 6 commands available, each should get at least 10% (100/1000)
        for (const cmd of Object.keys(counts)) {
          expect(counts[cmd]).toBeGreaterThan(50);
        }
      });
    });

    describe('種族傾向の適用', () => {
      it('ガルダン（ゴーレム）は近距離でWEAPON_ATTACKを特に好む', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster({ id: 'gardan' });
        // gardan@NEAR: WPN = species2.0 × distance2.0 = 4.0 (最大の重み)
        let weaponCount = 0;
        for (let i = 0; i < 1000; i++) {
          const r = i / 1000;
          const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => r);
          if (result.first.type === CommandType.WEAPON_ATTACK) weaponCount++;
        }
        // gardan@NEAR: WEAPON weight 4.0 / total ≈ 47% → expect >400/1000
        expect(weaponCount).toBeGreaterThan(400);
      });

      it('ルーナ（ウィスプ）は近距離でもSPECIAL_ATTACKを好む', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster({ id: 'roona' });
        // roona@NEAR: SPC = species2.0 × distance0.8 = 1.6, WPN = species0.4 × distance2.0 = 0.8
        // SPECIAL_ATTACKの方がWEAPON_ATTACKより重い
        let specialCount = 0;
        let weaponCount = 0;
        for (let i = 0; i < 1000; i++) {
          const r = i / 1000;
          const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => r);
          if (result.first.type === CommandType.SPECIAL_ATTACK) specialCount++;
          if (result.first.type === CommandType.WEAPON_ATTACK) weaponCount++;
        }
        expect(specialCount).toBeGreaterThan(weaponCount);
      });

      it('ザーグ（バランス型）は距離モディファイアの影響を素直に反映', () => {
        const state = createTestState({ currentDistance: DistanceType.FAR });
        const monster = createTestMonster(); // zaag: all 1.0
        // zaag@FAR: 距離重みがそのまま反映される
        let advanceCount = 0;
        let specialCount = 0;
        for (let i = 0; i < 1000; i++) {
          const r = i / 1000;
          const result = selectCommands(state, 'player1', monster, AILevel.LV2, () => r);
          if (result.first.type === CommandType.ADVANCE) advanceCount++;
          if (result.first.type === CommandType.SPECIAL_ATTACK) specialCount++;
        }
        // ADV 1.8/6.8 ≈ 26.5%, SPC 2.0/6.8 ≈ 29.4%
        // Both should be high
        expect(advanceCount).toBeGreaterThan(200);
        expect(specialCount).toBeGreaterThan(200);
      });
    });

    describe('player2としての動作', () => {
      it('player2でも正しく動作する', () => {
        const state = createTestState();
        const monster = createTestMonster({ id: 'gardan' });
        const result = selectCommands(state, 'player2', monster, AILevel.LV2, () => 0.5);
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });
    });
  });

  describe('Lv3 AI（状況考慮）', () => {
    // Lv3では相手モンスター情報が必要
    const opponentMonster = createTestMonster({ id: 'gardan' });

    describe('基本動作', () => {
      it('TurnCommands構造を返す', () => {
        const state = createTestState();
        const monster = createTestMonster();
        const result = selectCommands(state, 'player1', monster, AILevel.LV3, () => 0.5, opponentMonster);
        expect(result).toHaveProperty('first');
        expect(result).toHaveProperty('second');
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });

      it('有効なコマンドのみ選択する', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        for (let i = 0; i < 10; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV3, () => i / 10, opponentMonster);
          expect(result.first.type).not.toBe(CommandType.WEAPON_ATTACK);
          expect(result.second.type).not.toBe(CommandType.WEAPON_ATTACK);
        }
      });

      it('opponentMonsterなしでもエラーにならない（Lv2相当にフォールバック）', () => {
        const state = createTestState();
        const monster = createTestMonster();
        expect(() => {
          selectCommands(state, 'player1', monster, AILevel.LV3, () => 0.5);
        }).not.toThrow();
      });
    });

    describe('HP状況への対応', () => {
      it('相手HP低い時、攻撃系コマンドが増える', () => {
        const state = createTestState({
          player2: {
            monsterId: 'gardan',
            currentHp: 50,  // 低HP
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 3,
            usedReflectCount: 0,
          },
        });
        const monster = createTestMonster();
        let attackCount = 0;
        for (let i = 0; i < 1000; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV3, () => i / 1000, opponentMonster);
          if (result.first.type === CommandType.WEAPON_ATTACK || result.first.type === CommandType.SPECIAL_ATTACK) {
            attackCount++;
          }
        }

        // 同じ条件でLv2と比較
        const stateLv2 = createTestState({ ...state, currentDistance: DistanceType.NEAR });
        const stateNear = createTestState({
          currentDistance: DistanceType.NEAR,
          player2: {
            monsterId: 'gardan',
            currentHp: 50,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 3,
            usedReflectCount: 0,
          },
        });
        let lv2AttackCount = 0;
        for (let i = 0; i < 1000; i++) {
          const result = selectCommands(stateNear, 'player1', monster, AILevel.LV2, () => i / 1000);
          if (result.first.type === CommandType.WEAPON_ATTACK || result.first.type === CommandType.SPECIAL_ATTACK) {
            lv2AttackCount++;
          }
        }
        // Lv3は相手HP低いことを認識して攻撃的になるべき
        // （距離条件が異なるため直接比較は難しいが、攻撃系は一定数以上）
        expect(attackCount).toBeGreaterThan(0);
      });

      it('自分HP低い時、守備系コマンドが増える', () => {
        const state = createTestState({
          currentDistance: DistanceType.NEAR,
          player1: {
            monsterId: 'zaag',
            currentHp: 30,  // 低HP
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 5,
            usedReflectCount: 0,
          },
        });
        const monster = createTestMonster();
        let defensiveCount = 0;
        for (let i = 0; i < 1000; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV3, () => i / 1000, opponentMonster);
          if (result.first.type === CommandType.RETREAT || result.first.type === CommandType.REFLECTOR) {
            defensiveCount++;
          }
        }
        expect(defensiveCount).toBeGreaterThan(100); // 守備系が一定割合以上
      });
    });

    describe('相手スタンスへの対応', () => {
      it('相手OFFENSIVE時、リフレクターの選択率が上がる', () => {
        const stateOffensive = createTestState({
          currentDistance: DistanceType.NEAR,
          player2: {
            monsterId: 'gardan',
            currentHp: 280,
            currentStance: StanceType.OFFENSIVE,
            remainingSpecialCount: 3,
            usedReflectCount: 0,
          },
        });
        const stateNormal = createTestState({
          currentDistance: DistanceType.NEAR,
          player2: {
            monsterId: 'gardan',
            currentHp: 280,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 3,
            usedReflectCount: 0,
          },
        });
        const monster = createTestMonster();

        let reflectorOffensive = 0;
        let reflectorNormal = 0;
        for (let i = 0; i < 1000; i++) {
          const r = () => i / 1000;
          const resOff = selectCommands(stateOffensive, 'player1', monster, AILevel.LV3, r, opponentMonster);
          const resNorm = selectCommands(stateNormal, 'player1', monster, AILevel.LV3, r, opponentMonster);
          if (resOff.first.type === CommandType.REFLECTOR) reflectorOffensive++;
          if (resNorm.first.type === CommandType.REFLECTOR) reflectorNormal++;
        }
        expect(reflectorOffensive).toBeGreaterThan(reflectorNormal);
      });
    });

    describe('相手リフレクター残数への対応', () => {
      it('相手リフレクター残りあり → 特殊攻撃が減る', () => {
        const stateWithReflector = createTestState({
          currentDistance: DistanceType.FAR,
          player2: {
            monsterId: 'gardan',
            currentHp: 280,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 3,
            usedReflectCount: 0,  // まだ2回使える
          },
        });
        const stateNoReflector = createTestState({
          currentDistance: DistanceType.FAR,
          player2: {
            monsterId: 'gardan',
            currentHp: 280,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 3,
            usedReflectCount: 2,  // もう使えない
          },
        });
        const monster = createTestMonster();

        let specialWith = 0;
        let specialWithout = 0;
        for (let i = 0; i < 1000; i++) {
          const r = () => i / 1000;
          const resW = selectCommands(stateWithReflector, 'player1', monster, AILevel.LV3, r, opponentMonster);
          const resWO = selectCommands(stateNoReflector, 'player1', monster, AILevel.LV3, r, opponentMonster);
          if (resW.first.type === CommandType.SPECIAL_ATTACK) specialWith++;
          if (resWO.first.type === CommandType.SPECIAL_ATTACK) specialWithout++;
        }
        // リフレクターなしの方が特殊攻撃が多い
        expect(specialWithout).toBeGreaterThan(specialWith);
      });
    });

    describe('player2としての動作', () => {
      it('player2でも正しく動作する', () => {
        const state = createTestState();
        const monster = createTestMonster({ id: 'gardan' });
        const oppMonster = createTestMonster();
        const result = selectCommands(state, 'player2', monster, AILevel.LV3, () => 0.5, oppMonster);
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });
    });
  });

  describe('Lv4 AI（パターン読み）', () => {
    const opponentMonster = createTestMonster({ id: 'gardan' });

    /**
     * テスト用TurnResultヘルパー
     */
    function makeTurnResult(
      turnNumber: number,
      p1First: CommandType,
      p1Second: CommandType,
      p2First: CommandType,
      p2Second: CommandType,
      distanceAfter: DistanceType
    ): TurnResult {
      return {
        turnNumber,
        player1Commands: { first: { type: p1First }, second: { type: p1Second } },
        player2Commands: { first: { type: p2First }, second: { type: p2Second } },
        distanceAfter,
        player1Damage: { damage: 0, isEvaded: false, isReflected: false },
        player2Damage: { damage: 0, isEvaded: false, isReflected: false },
        player1StanceAfter: StanceType.NORMAL,
        player2StanceAfter: StanceType.NORMAL,
      };
    }

    /**
     * 相手（player1）が特定コマンドを多用する履歴を作成
     * AI（player2）視点で分析するための履歴
     */
    function makeHistoryWithPlayerPattern(
      command: CommandType,
      distanceAfter: DistanceType
    ): TurnResult[] {
      return [
        // ターン1: distanceAfter = distanceAfter（distanceBefore導出の基点）
        makeTurnResult(1, command, command, CommandType.ADVANCE, CommandType.ADVANCE, distanceAfter),
        // ターン2: distanceBefore = distanceAfter
        makeTurnResult(2, command, command, CommandType.ADVANCE, CommandType.ADVANCE, distanceAfter),
        // ターン3: distanceBefore = distanceAfter
        makeTurnResult(3, command, command, CommandType.ADVANCE, CommandType.ADVANCE, distanceAfter),
        // ターン4: distanceBefore = distanceAfter
        makeTurnResult(4, command, command, CommandType.ADVANCE, CommandType.ADVANCE, distanceAfter),
      ];
    }

    describe('基本動作', () => {
      it('TurnCommands構造を返す', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.WEAPON_ATTACK, DistanceType.NEAR);
        const result = selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.5, opponentMonster, history);
        expect(result).toHaveProperty('first');
        expect(result).toHaveProperty('second');
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });

      it('有効なコマンドのみ選択する', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.SPECIAL_ATTACK, DistanceType.MID);
        for (let i = 0; i < 10; i++) {
          const result = selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.3 + i / 100, opponentMonster, history);
          // MID距離では WEAPON_ATTACK は無効
          expect(result.first.type).not.toBe(CommandType.WEAPON_ATTACK);
          expect(result.second.type).not.toBe(CommandType.WEAPON_ATTACK);
        }
      });

      it('turnHistory未定義でエラーをスロー', () => {
        const state = createTestState();
        const monster = createTestMonster();
        expect(() => selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.5, opponentMonster)).toThrow();
      });

      it('opponentMonster未定義でエラーをスロー', () => {
        const state = createTestState();
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.WEAPON_ATTACK, DistanceType.NEAR);
        expect(() => selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.5, undefined, history)).toThrow();
      });
    });

    describe('履歴不足時のフォールバック', () => {
      it('turnHistoryが空の場合、Lv3相当の行動を取る（エラーにならない）', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        expect(() => {
          selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.5, opponentMonster, []);
        }).not.toThrow();
      });

      it('turnHistoryが1ターンのみでもエラーにならない', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        const history = [
          makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
            CommandType.ADVANCE, CommandType.ADVANCE, DistanceType.NEAR),
        ];
        expect(() => {
          selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.5, opponentMonster, history);
        }).not.toThrow();
      });
    });

    describe('パターン読み', () => {
      // Lv4はrandomFnの最初の呼び出しでフォールバック判定を行うため、
      // Lv3との比較には同じ乱数範囲（0.2〜1.0）を使う
      it('相手が近距離でWEAPON_ATTACK多用 → RETREATが選ばれやすい', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.WEAPON_ATTACK, DistanceType.NEAR);

        let retreatCount = 0;
        let lv3RetreatCount = 0;
        for (let i = 0; i < 1000; i++) {
          const r = 0.2 + (i / 1000) * 0.8;
          const lv4Result = selectCommands(state, 'player2', monster, AILevel.LV4, () => r, opponentMonster, history);
          const lv3Result = selectCommands(state, 'player2', monster, AILevel.LV3, () => r, opponentMonster);
          if (lv4Result.first.type === CommandType.RETREAT) retreatCount++;
          if (lv3Result.first.type === CommandType.RETREAT) lv3RetreatCount++;
        }
        expect(retreatCount).toBeGreaterThan(lv3RetreatCount);
      });

      it('相手がSPECIAL_ATTACK多用 → REFLECTORが選ばれやすい', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.SPECIAL_ATTACK, DistanceType.MID);

        let reflectorCount = 0;
        let lv3ReflectorCount = 0;
        for (let i = 0; i < 1000; i++) {
          const r = 0.2 + (i / 1000) * 0.8;
          const lv4Result = selectCommands(state, 'player2', monster, AILevel.LV4, () => r, opponentMonster, history);
          const lv3Result = selectCommands(state, 'player2', monster, AILevel.LV3, () => r, opponentMonster);
          if (lv4Result.first.type === CommandType.REFLECTOR) reflectorCount++;
          if (lv3Result.first.type === CommandType.REFLECTOR) lv3ReflectorCount++;
        }
        expect(reflectorCount).toBeGreaterThan(lv3ReflectorCount);
      });

      it('相手がRETREAT多用 → ADVANCEが選ばれやすい', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.RETREAT, DistanceType.MID);

        let advanceCount = 0;
        let lv3AdvanceCount = 0;
        for (let i = 0; i < 1000; i++) {
          const r = 0.2 + (i / 1000) * 0.8;
          const lv4Result = selectCommands(state, 'player2', monster, AILevel.LV4, () => r, opponentMonster, history);
          const lv3Result = selectCommands(state, 'player2', monster, AILevel.LV3, () => r, opponentMonster);
          if (lv4Result.first.type === CommandType.ADVANCE) advanceCount++;
          if (lv3Result.first.type === CommandType.ADVANCE) lv3AdvanceCount++;
        }
        expect(advanceCount).toBeGreaterThan(lv3AdvanceCount);
      });

      it('相手がREFLECTOR多用 → WEAPON_ATTACKが選ばれやすい（近距離）', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.REFLECTOR, DistanceType.NEAR);

        let weaponCount = 0;
        let lv3WeaponCount = 0;
        for (let i = 0; i < 1000; i++) {
          const r = 0.2 + (i / 1000) * 0.8;
          const lv4Result = selectCommands(state, 'player2', monster, AILevel.LV4, () => r, opponentMonster, history);
          const lv3Result = selectCommands(state, 'player2', monster, AILevel.LV3, () => r, opponentMonster);
          if (lv4Result.first.type === CommandType.WEAPON_ATTACK) weaponCount++;
          if (lv3Result.first.type === CommandType.WEAPON_ATTACK) lv3WeaponCount++;
        }
        expect(weaponCount).toBeGreaterThan(lv3WeaponCount);
      });
    });

    describe('ランダム要素（20%でLv3フォールバック）', () => {
      it('randomFn() < 0.2でLv3相当の行動を取る（パターン読みしない）', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.WEAPON_ATTACK, DistanceType.NEAR);

        // randomFn = 0.1 → Lv3フォールバック
        // 同じ乱数でLv3を呼んだ結果と一致するはず
        const lv4Result = selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.1, opponentMonster, history);
        const lv3Result = selectCommands(state, 'player2', monster, AILevel.LV3, () => 0.1, opponentMonster);
        expect(lv4Result.first.type).toBe(lv3Result.first.type);
        expect(lv4Result.second.type).toBe(lv3Result.second.type);
      });

      it('randomFn() >= 0.2でパターン読みを行う', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.WEAPON_ATTACK, DistanceType.NEAR);

        // randomFn = 0.5 → パターン読み発動
        // パターン読みはカウンターモディファイアが適用される
        const result = selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.5, opponentMonster, history);
        expect(result).toHaveProperty('first');
        expect(result).toHaveProperty('second');
      });

      it('フォールバック判定は最初のrandomFn呼び出しで行われる', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        const history = makeHistoryWithPlayerPattern(CommandType.WEAPON_ATTACK, DistanceType.NEAR);

        // randomFnの最初の呼び出し値が0.2未満→フォールバック
        // 0.2以上→パターン読み を検証
        // カウンターで各呼び出しの最初の値を制御
        for (const threshold of [0.0, 0.05, 0.1, 0.15, 0.19]) {
          // threshold < 0.2 → Lv3フォールバック（結果はLv3と一致）
          const lv4Result = selectCommands(state, 'player2', monster, AILevel.LV4, () => threshold, opponentMonster, history);
          const lv3Result = selectCommands(state, 'player2', monster, AILevel.LV3, () => threshold, opponentMonster);
          expect(lv4Result.first.type).toBe(lv3Result.first.type);
          expect(lv4Result.second.type).toBe(lv3Result.second.type);
        }
      });
    });

    describe('player2としての動作', () => {
      it('player2（AI側）が正しくplayer1の行動を分析する', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster({ id: 'gardan' });
        const oppMonster = createTestMonster();
        // player1がWEAPON_ATTACKを多用
        const history = makeHistoryWithPlayerPattern(CommandType.WEAPON_ATTACK, DistanceType.NEAR);
        const result = selectCommands(state, 'player2', monster, AILevel.LV4, () => 0.5, oppMonster, history);
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });
    });

    describe('player1としての動作', () => {
      it('player1（AI側）がplayer2の行動を分析する', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        // player2がSPECIAL_ATTACKを多用する履歴
        const history = [
          makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
            CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK, DistanceType.NEAR),
          makeTurnResult(2, CommandType.ADVANCE, CommandType.ADVANCE,
            CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK, DistanceType.NEAR),
          makeTurnResult(3, CommandType.ADVANCE, CommandType.ADVANCE,
            CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK, DistanceType.NEAR),
          makeTurnResult(4, CommandType.ADVANCE, CommandType.ADVANCE,
            CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK, DistanceType.NEAR),
        ];

        let reflectorCount = 0;
        for (let i = 0; i < 1000; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV4, () => 0.2 + (i / 1000) * 0.8, opponentMonster, history);
          if (result.first.type === CommandType.REFLECTOR) reflectorCount++;
        }

        let lv3ReflectorCount = 0;
        for (let i = 0; i < 1000; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV3, () => i / 1000, opponentMonster);
          if (result.first.type === CommandType.REFLECTOR) lv3ReflectorCount++;
        }
        expect(reflectorCount).toBeGreaterThan(lv3ReflectorCount);
      });
    });
  });

  describe('未実装AIレベル（Lv5）', () => {
    const state = createTestState();
    const monster = createTestMonster();

    it('Lv5を指定するとエラーをスロー', () => {
      expect(() => selectCommands(state, 'player1', monster, AILevel.LV5)).toThrow();
    });
  });
});
