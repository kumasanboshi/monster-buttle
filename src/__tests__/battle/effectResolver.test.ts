import { resolveBattleEffects } from '../../battle/effectResolver';
import { CommandType, DistanceType, StanceType, TurnResult, DamageInfo, CommandPhaseResult, BattleEffectType } from '../../types';
import { BattleEffect } from '../../types/BattleEffect';

/** テスト用のDamageInfo生成ヘルパー */
function makeDamageInfo(overrides: Partial<DamageInfo> = {}): DamageInfo {
  return {
    damage: 0,
    isEvaded: false,
    isReflected: false,
    ...overrides,
  };
}

/** テスト用のCommandPhaseResult生成ヘルパー */
function makePhase(overrides: Partial<CommandPhaseResult> = {}): CommandPhaseResult {
  return {
    player1Command: CommandType.ADVANCE,
    player2Command: CommandType.ADVANCE,
    distanceAfter: DistanceType.MID,
    player1Damage: makeDamageInfo(),
    player2Damage: makeDamageInfo(),
    ...overrides,
  };
}

/** テスト用のTurnResult生成ヘルパー */
function makeTurnResult(
  phase1: CommandPhaseResult,
  phase2: CommandPhaseResult,
  overrides: Partial<TurnResult> = {}
): TurnResult {
  return {
    turnNumber: 1,
    player1Commands: {
      first: { type: phase1.player1Command },
      second: { type: phase2.player1Command },
    },
    player2Commands: {
      first: { type: phase1.player2Command },
      second: { type: phase2.player2Command },
    },
    distanceAfter: phase2.distanceAfter,
    player1Damage: makeDamageInfo({
      damage: phase1.player1Damage.damage + phase2.player1Damage.damage,
      isEvaded: phase1.player1Damage.isEvaded || phase2.player1Damage.isEvaded,
      isReflected: phase1.player1Damage.isReflected || phase2.player1Damage.isReflected,
    }),
    player2Damage: makeDamageInfo({
      damage: phase1.player2Damage.damage + phase2.player2Damage.damage,
      isEvaded: phase1.player2Damage.isEvaded || phase2.player2Damage.isEvaded,
      isReflected: phase1.player2Damage.isReflected || phase2.player2Damage.isReflected,
    }),
    player1StanceAfter: StanceType.NORMAL,
    player2StanceAfter: StanceType.NORMAL,
    phases: [phase1, phase2],
    ...overrides,
  };
}

/** 指定タイプのエフェクトを探すヘルパー */
function findEffects(effects: BattleEffect[], type: BattleEffectType): BattleEffect[] {
  return effects.filter(e => e.type === type);
}

describe('resolveBattleEffects', () => {
  describe('距離移動エフェクト', () => {
    it('距離が変わった場合DISTANCE_MOVEエフェクトを生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.ADVANCE,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.NEAR,
      });
      const phase2 = makePhase({
        player1Command: CommandType.RETREAT,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
      });
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      // フェーズ1: MID→NEAR 距離移動
      const phase1Effects = sequence[0];
      const distMoves1 = findEffects(phase1Effects, BattleEffectType.DISTANCE_MOVE);
      expect(distMoves1.length).toBe(1);
      expect(distMoves1[0].distanceFrom).toBe(DistanceType.MID);
      expect(distMoves1[0].distanceTo).toBe(DistanceType.NEAR);
    });

    it('距離が変わらない場合DISTANCE_MOVEエフェクトは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.WEAPON_ATTACK,
        distanceAfter: DistanceType.MID,
      });
      const phase2 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.WEAPON_ATTACK,
        distanceAfter: DistanceType.MID,
      });
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      for (const phaseEffects of sequence) {
        const distMoves = findEffects(phaseEffects, BattleEffectType.DISTANCE_MOVE);
        expect(distMoves.length).toBe(0);
      }
    });
  });

  describe('武器攻撃エフェクト', () => {
    it('武器攻撃でダメージがある場合WEAPON_ATTACKとDAMAGE_NUMBERを生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ damage: 30 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const weaponEffects = findEffects(phase1Effects, BattleEffectType.WEAPON_ATTACK);
      expect(weaponEffects.length).toBe(1);
      expect(weaponEffects[0].target).toBe('enemy');

      const damageEffects = findEffects(phase1Effects, BattleEffectType.DAMAGE_NUMBER);
      expect(damageEffects.length).toBe(1);
      expect(damageEffects[0].target).toBe('enemy');
      expect(damageEffects[0].value).toBe(30);
    });

    it('武器攻撃が回避された場合EVASIONエフェクトを生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ isEvaded: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const evasionEffects = findEffects(phase1Effects, BattleEffectType.EVASION);
      expect(evasionEffects.length).toBe(1);
      expect(evasionEffects[0].target).toBe('enemy');
    });
  });

  describe('特殊攻撃エフェクト', () => {
    it('特殊攻撃でダメージがある場合SPECIAL_ATTACK(value付き)を生成しDAMAGE_NUMBERは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ damage: 25 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const specialEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_ATTACK);
      expect(specialEffects.length).toBe(1);
      expect(specialEffects[0].target).toBe('enemy');
      // ダメージ値はSPECIAL_ATTACKエフェクト自体に埋め込み（命中タイミングで表示するため）
      expect(specialEffects[0].value).toBe(25);

      // 別途DAMAGE_NUMBERは生成しない（命中前に表示されてしまうため）
      expect(findEffects(phase1Effects, BattleEffectType.DAMAGE_NUMBER).length).toBe(0);
    });

    it('特殊攻撃が回避された場合SPECIAL_EVASIONエフェクトを生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ isEvaded: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const specialEvasionEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_EVASION);
      expect(specialEvasionEffects.length).toBe(1);
      expect(specialEvasionEffects[0].target).toBe('enemy');
    });
  });

  describe('リフレクターエフェクト', () => {
    it('反射された場合SPECIAL_REFLECT(target:enemy, reflectedDamage)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.REFLECTOR,
        distanceAfter: DistanceType.MID,
        // P1が反射ダメージを受ける
        player1Damage: makeDamageInfo({ damage: 15, isReflected: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const reflectEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_REFLECT);
      expect(reflectEffects.length).toBe(1);
      expect(reflectEffects[0].target).toBe('enemy'); // リフレクター保持者（P2）側
      expect(reflectEffects[0].reflectedDamage).toBe(15); // 攻撃者に返るダメージ

      // SPECIAL_REFLECT に一本化されるので、旧エフェクトは生成されない
      expect(findEffects(phase1Effects, BattleEffectType.REFLECTOR).length).toBe(0);
      expect(findEffects(phase1Effects, BattleEffectType.DAMAGE_NUMBER).length).toBe(0);
    });

    it('残回数0でSPECIAL_ATTACKをブロックした場合REFLECTOR_BLOCK(target:enemy)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.REFLECTOR,
        distanceAfter: DistanceType.MID,
        // 残回数0: 双方ダメージなし、反射なし
        player1Damage: makeDamageInfo({ damage: 0, isReflected: false }),
        player2Damage: makeDamageInfo({ damage: 0 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const blockEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR_BLOCK);
      expect(blockEffects.length).toBe(1);
      expect(blockEffects[0].target).toBe('enemy'); // ブロックしたのはP2

      // 反射成功エフェクトは生成しない
      const reflectorEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR);
      expect(reflectorEffects.length).toBe(0);
    });

    it('P2がSPECIAL_ATTACKでP1がREFLECTOR残回数0の場合REFLECTOR_BLOCK(target:player)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.REFLECTOR,
        player2Command: CommandType.SPECIAL_ATTACK,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ damage: 0, isReflected: false }),
        player1Damage: makeDamageInfo({ damage: 0 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const blockEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR_BLOCK);
      expect(blockEffects.length).toBe(1);
      expect(blockEffects[0].target).toBe('player'); // ブロックしたのはP1
    });

    it('P2がSPECIAL_ATTACKでP1がREFLECTOR残回数ありで反射される場合SPECIAL_REFLECT(target:player)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.REFLECTOR,
        player2Command: CommandType.SPECIAL_ATTACK,
        distanceAfter: DistanceType.MID,
        // P2が反射ダメージを受ける
        player2Damage: makeDamageInfo({ damage: 20, isReflected: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const reflectEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_REFLECT);
      expect(reflectEffects.length).toBe(1);
      expect(reflectEffects[0].target).toBe('player'); // リフレクター保持者（P1）側
      expect(reflectEffects[0].reflectedDamage).toBe(20); // P2（攻撃者）に返るダメージ
    });

    it('反射成功の場合はREFLECTOR_BLOCKを生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.REFLECTOR,
        distanceAfter: DistanceType.MID,
        player1Damage: makeDamageInfo({ damage: 15, isReflected: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const blockEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR_BLOCK);
      expect(blockEffects.length).toBe(0);
    });

    it('WEAPON_ATTACKがREFLECTORを使った相手に当たった場合REFLECTOR_BLOCKは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.REFLECTOR,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ damage: 20 }), // 武器は貫通してダメージ
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const blockEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR_BLOCK);
      expect(blockEffects.length).toBe(0);
    });
  });

  describe('フェーズ順序', () => {
    it('1stコマンドのエフェクトが2ndコマンドより先に配置される', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ damage: 30 }),
      });
      const phase2 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.FAR,
        player2Damage: makeDamageInfo({ damage: 20 }),
      });
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      // sequenceは少なくとも2フェーズ
      expect(sequence.length).toBeGreaterThanOrEqual(2);

      // フェーズ1にWEAPON_ATTACK、フェーズ2にSPECIAL_ATTACK
      const phase1WeaponEffects = findEffects(sequence[0], BattleEffectType.WEAPON_ATTACK);
      expect(phase1WeaponEffects.length).toBe(1);

      // 2番目以降のフェーズにSPECIAL_ATTACK
      const laterEffects = sequence.slice(1).flat();
      const specialEffects = laterEffects.filter((e: BattleEffect) => e.type === BattleEffectType.SPECIAL_ATTACK);
      expect(specialEffects.length).toBe(1);
    });

    it('各フェーズ内で距離→攻撃→ダメージの順に配置される', () => {
      const phase1 = makePhase({
        player1Command: CommandType.ADVANCE,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.NEAR,
      });
      const phase2 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.WEAPON_ATTACK,
        distanceAfter: DistanceType.NEAR,
        player1Damage: makeDamageInfo({ damage: 30 }),
        player2Damage: makeDamageInfo({ damage: 25 }),
      });
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      // フェーズ2のエフェクト内の順序を確認
      const phase2Effects = sequence[1];
      const attackIndex = phase2Effects.findIndex(
        (e: BattleEffect) => e.type === BattleEffectType.WEAPON_ATTACK
      );
      const damageIndex = phase2Effects.findIndex(
        (e: BattleEffect) => e.type === BattleEffectType.DAMAGE_NUMBER
      );
      // 攻撃エフェクトはダメージ数値より先に配置
      if (attackIndex !== -1 && damageIndex !== -1) {
        expect(attackIndex).toBeLessThan(damageIndex);
      }
    });
  });

  describe('ダメージなし', () => {
    it('ダメージ0の場合DAMAGE_NUMBERは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.WEAPON_ATTACK,
        distanceAfter: DistanceType.MID,
        // MID距離で武器攻撃は無効（NO_EFFECT）→ ダメージ0
        player1Damage: makeDamageInfo({ damage: 0 }),
        player2Damage: makeDamageInfo({ damage: 0 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      for (const phaseEffects of sequence) {
        const damageEffects = findEffects(phaseEffects, BattleEffectType.DAMAGE_NUMBER);
        expect(damageEffects.length).toBe(0);
      }
    });

    it('移動のみのコマンドではエフェクトを生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.ADVANCE,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.MID, // 変化なし
      });
      const phase2 = makePhase({
        player1Command: CommandType.ADVANCE,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.MID, // 変化なし
      });
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      // すべてのフェーズでエフェクトなし
      for (const phaseEffects of sequence) {
        expect(phaseEffects.length).toBe(0);
      }
    });
  });

  describe('スタンス変更エフェクト', () => {
    it('P1がSTANCE_Aを使った場合STANCE_CHANGE(target:player)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.STANCE_A,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.MID,
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2, {
        player1StanceAfter: StanceType.OFFENSIVE,
      });
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const stanceEffects = findEffects(phase1Effects, BattleEffectType.STANCE_CHANGE);
      expect(stanceEffects.length).toBe(1);
      expect(stanceEffects[0].target).toBe('player');
      expect(stanceEffects[0].stanceTo).toBe(StanceType.OFFENSIVE);
    });

    it('P1がSTANCE_Bを使った場合STANCE_CHANGE(target:player)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.STANCE_B,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.MID,
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2, {
        player1StanceAfter: StanceType.DEFENSIVE,
      });
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const stanceEffects = findEffects(phase1Effects, BattleEffectType.STANCE_CHANGE);
      expect(stanceEffects.length).toBe(1);
      expect(stanceEffects[0].target).toBe('player');
      expect(stanceEffects[0].stanceTo).toBe(StanceType.DEFENSIVE);
    });

    it('P2がSTANCE_Aを使った場合STANCE_CHANGE(target:enemy)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.ADVANCE,
        player2Command: CommandType.STANCE_A,
        distanceAfter: DistanceType.MID,
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2, {
        player2StanceAfter: StanceType.OFFENSIVE,
      });
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const stanceEffects = findEffects(phase1Effects, BattleEffectType.STANCE_CHANGE);
      expect(stanceEffects.length).toBe(1);
      expect(stanceEffects[0].target).toBe('enemy');
      expect(stanceEffects[0].stanceTo).toBe(StanceType.OFFENSIVE);
    });

    it('スタンス変更なしの場合STANCE_CHANGEは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ damage: 20 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      for (const phaseEffects of sequence) {
        const stanceEffects = findEffects(phaseEffects, BattleEffectType.STANCE_CHANGE);
        expect(stanceEffects.length).toBe(0);
      }
    });

    it('2ndフェーズのSTANCE_BはPhase2のエフェクトとして生成する', () => {
      const phase1 = makePhase();
      const phase2 = makePhase({
        player1Command: CommandType.STANCE_B,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.MID,
      });
      const turnResult = makeTurnResult(phase1, phase2, {
        player1StanceAfter: StanceType.DEFENSIVE,
      });
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase2Effects = sequence[1];
      const stanceEffects = findEffects(phase2Effects, BattleEffectType.STANCE_CHANGE);
      expect(stanceEffects.length).toBe(1);
      expect(stanceEffects[0].target).toBe('player');
    });
  });

  describe('リフレクター構えエフェクト', () => {
    it('P1がREFLECTORを使いP2が攻撃しなかった場合REFLECTOR_DEPLOY(target:player)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.REFLECTOR,
        player2Command: CommandType.ADVANCE,
        distanceAfter: DistanceType.MID,
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const deployEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR_DEPLOY);
      expect(deployEffects.length).toBe(1);
      expect(deployEffects[0].target).toBe('player');
    });

    it('P2がREFLECTORを使いP1が攻撃しなかった場合REFLECTOR_DEPLOY(target:enemy)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.ADVANCE,
        player2Command: CommandType.REFLECTOR,
        distanceAfter: DistanceType.MID,
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const deployEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR_DEPLOY);
      expect(deployEffects.length).toBe(1);
      expect(deployEffects[0].target).toBe('enemy');
    });

    it('P1がREFLECTORを使いP2がSPECIAL_ATTACKを使った場合REFLECTOR_DEPLOYは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.REFLECTOR,
        player2Command: CommandType.SPECIAL_ATTACK,
        distanceAfter: DistanceType.MID,
        player1Damage: makeDamageInfo({ damage: 15, isReflected: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const deployEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR_DEPLOY);
      expect(deployEffects.length).toBe(0);
    });

    it('P1がREFLECTORを使いP2がWEAPON_ATTACKを使った場合REFLECTOR_DEPLOYは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.REFLECTOR,
        player2Command: CommandType.WEAPON_ATTACK,
        distanceAfter: DistanceType.MID,
        player1Damage: makeDamageInfo({ damage: 10 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const deployEffects = findEffects(phase1Effects, BattleEffectType.REFLECTOR_DEPLOY);
      expect(deployEffects.length).toBe(0);
    });
  });

  describe('SPECIAL_EVASION（特殊攻撃が回避された）', () => {
    it('SPECIAL_ATTACKが回避された場合SPECIAL_EVASIONを生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ isEvaded: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const specialEvasionEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_EVASION);
      expect(specialEvasionEffects.length).toBe(1);
    });

    it('SPECIAL_EVASIONのターゲットは防御側（P1特殊→target:enemy）', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ isEvaded: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const specialEvasionEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_EVASION);
      expect(specialEvasionEffects[0].target).toBe('enemy');
    });

    it('P2がSPECIAL_ATTACKを使いP1が回避した場合SPECIAL_EVASION(target:player)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.RETREAT,
        player2Command: CommandType.SPECIAL_ATTACK,
        distanceAfter: DistanceType.MID,
        player1Damage: makeDamageInfo({ isEvaded: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const specialEvasionEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_EVASION);
      expect(specialEvasionEffects.length).toBe(1);
      expect(specialEvasionEffects[0].target).toBe('player');
    });

    it('WEAPON_ATTACKが回避された場合は引き続きEVASIONを生成する（影響なし）', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ isEvaded: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const evasionEffects = findEffects(phase1Effects, BattleEffectType.EVASION);
      expect(evasionEffects.length).toBe(1);
      expect(evasionEffects[0].target).toBe('enemy');

      // SPECIAL_EVASIONは生成しない
      const specialEvasionEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_EVASION);
      expect(specialEvasionEffects.length).toBe(0);
    });
  });

  describe('SPECIAL_CHARGE_FIZZLE（特殊攻撃が武器で潰された）', () => {
    it('SPECIAL_ATTACKでdamageToDefender.damage === 0の場合SPECIAL_CHARGE_FIZZLEを生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.WEAPON_ATTACK,
        distanceAfter: DistanceType.NEAR,
        // 武器攻撃で特殊攻撃が潰された → P2へのダメージ0
        player2Damage: makeDamageInfo({ damage: 0 }),
        player1Damage: makeDamageInfo({ damage: 15 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.NEAR);

      const phase1Effects = sequence[0];
      const fizzleEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_CHARGE_FIZZLE);
      expect(fizzleEffects.length).toBe(1);
    });

    it('SPECIAL_CHARGE_FIZZLEのターゲットはP1が特殊攻撃した場合player（攻撃側）', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.WEAPON_ATTACK,
        distanceAfter: DistanceType.NEAR,
        player2Damage: makeDamageInfo({ damage: 0 }),
        player1Damage: makeDamageInfo({ damage: 15 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.NEAR);

      const phase1Effects = sequence[0];
      const fizzleEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_CHARGE_FIZZLE);
      expect(fizzleEffects[0].target).toBe('player');
    });

    it('P2がSPECIAL_ATTACKでP1がWEAPON_ATTACKの場合、SPECIAL_CHARGE_FIZZLE(target:enemy)を生成する', () => {
      const phase1 = makePhase({
        player1Command: CommandType.WEAPON_ATTACK,
        player2Command: CommandType.SPECIAL_ATTACK,
        distanceAfter: DistanceType.NEAR,
        // P2の特殊攻撃が潰された → P1へのダメージ0
        player1Damage: makeDamageInfo({ damage: 0 }),
        player2Damage: makeDamageInfo({ damage: 20 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.NEAR);

      const phase1Effects = sequence[0];
      const fizzleEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_CHARGE_FIZZLE);
      expect(fizzleEffects.length).toBe(1);
      expect(fizzleEffects[0].target).toBe('enemy');
    });

    it('SPECIAL_ATTACKでdamageToDefender.damage > 0の場合SPECIAL_CHARGE_FIZZLEは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.RETREAT,
        distanceAfter: DistanceType.MID,
        player2Damage: makeDamageInfo({ damage: 25 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const fizzleEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_CHARGE_FIZZLE);
      expect(fizzleEffects.length).toBe(0);
    });

    it('SPECIAL_ATTACKがリフレクターで反射された場合SPECIAL_CHARGE_FIZZLEは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.REFLECTOR,
        distanceAfter: DistanceType.MID,
        player1Damage: makeDamageInfo({ damage: 15, isReflected: true }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const fizzleEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_CHARGE_FIZZLE);
      expect(fizzleEffects.length).toBe(0);
    });

    it('SPECIAL_ATTACKがリフレクターでブロックされた場合SPECIAL_CHARGE_FIZZLEは生成しない', () => {
      const phase1 = makePhase({
        player1Command: CommandType.SPECIAL_ATTACK,
        player2Command: CommandType.REFLECTOR,
        distanceAfter: DistanceType.MID,
        player1Damage: makeDamageInfo({ damage: 0, isReflected: false }),
        player2Damage: makeDamageInfo({ damage: 0 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const fizzleEffects = findEffects(phase1Effects, BattleEffectType.SPECIAL_CHARGE_FIZZLE);
      expect(fizzleEffects.length).toBe(0);
    });
  });

  describe('敵攻撃エフェクト', () => {
    it('P2の武器攻撃でプレイヤーにダメージ → targetはplayer', () => {
      const phase1 = makePhase({
        player1Command: CommandType.RETREAT,
        player2Command: CommandType.WEAPON_ATTACK,
        distanceAfter: DistanceType.MID,
        player1Damage: makeDamageInfo({ damage: 35 }),
      });
      const phase2 = makePhase();
      const turnResult = makeTurnResult(phase1, phase2);
      const sequence = resolveBattleEffects(turnResult, DistanceType.MID);

      const phase1Effects = sequence[0];
      const weaponEffects = findEffects(phase1Effects, BattleEffectType.WEAPON_ATTACK);
      expect(weaponEffects.length).toBe(1);
      expect(weaponEffects[0].target).toBe('player');

      const damageEffects = findEffects(phase1Effects, BattleEffectType.DAMAGE_NUMBER);
      expect(damageEffects.length).toBe(1);
      expect(damageEffects[0].target).toBe('player');
      expect(damageEffects[0].value).toBe(35);
    });
  });
});
