import Phaser from 'phaser';
import { BattleEffect, BattleEffectType, BattleEffectSequence, EffectTarget } from '../types/BattleEffect';
import { DistanceType } from '../types/Distance';
import { StanceType } from '../types/Stance';
import { DISTANCE_CHARACTER_POSITIONS } from './battleConfig';
import { EFFECT_CONFIG } from './battleConfig';
import { loadSettings, getEffectSpeedMultiplier } from '../utils/settingsManager';
import { playSe } from '../utils/audioManager';
import { AudioKey } from '../constants/audioKeys';

/**
 * エフェクト再生に必要なターゲットオブジェクト
 */
export interface EffectTargets {
  playerText: Phaser.GameObjects.Text;
  enemyText: Phaser.GameObjects.Text;
  playerImage?: Phaser.GameObjects.Image;
  enemyImage?: Phaser.GameObjects.Image;
  playerHpBarFill: Phaser.GameObjects.Rectangle;
  enemyHpBarFill: Phaser.GameObjects.Rectangle;
}

/**
 * バトルエフェクト再生クラス
 *
 * BattleEffectSequenceを受け取り、Phaser Tweensを使ってアニメーションを再生する。
 */
export class BattleEffectPlayer {
  private scene: Phaser.Scene;
  private targets: EffectTargets;
  private speedMultiplier: number;

  constructor(scene: Phaser.Scene, targets: EffectTargets) {
    this.scene = scene;
    this.targets = targets;
    const settings = loadSettings();
    this.speedMultiplier = getEffectSpeedMultiplier(settings.effectSpeed);
  }

  /**
   * エフェクトシーケンスを再生する
   * フェーズ内のエフェクトは同時実行、フェーズ間は順次実行
   */
  async playSequence(sequence: BattleEffectSequence): Promise<void> {
    for (const phaseEffects of sequence) {
      if (phaseEffects.length === 0) continue;
      await this.playPhase(phaseEffects);
    }
  }

  /**
   * 1フェーズ内のエフェクトを同時再生する
   */
  private async playPhase(effects: BattleEffect[]): Promise<void> {
    const promises = effects.map(effect => this.playEffect(effect));
    await Promise.all(promises);
  }

  /**
   * 個別エフェクトを再生する
   */
  private playEffect(effect: BattleEffect): Promise<void> {
    switch (effect.type) {
      case BattleEffectType.DAMAGE_NUMBER:
        return this.playDamageNumber(effect);
      case BattleEffectType.WEAPON_ATTACK:
        return this.playWeaponAttack(effect);
      case BattleEffectType.SPECIAL_ATTACK:
        return this.playSpecialAttack(effect);
      case BattleEffectType.REFLECTOR:
        return this.playReflector(effect);
      case BattleEffectType.EVASION:
        return this.playEvasion(effect);
      case BattleEffectType.DISTANCE_MOVE:
        return this.playDistanceMove(effect);
      case BattleEffectType.STANCE_CHANGE:
        return this.playStanceChange(effect);
      case BattleEffectType.REFLECTOR_DEPLOY:
        return this.playReflectorDeploy(effect);
      case BattleEffectType.REFLECTOR_BLOCK:
        return this.playReflectorBlock(effect);
      case BattleEffectType.SPECIAL_REFLECT:
        return this.playSpecialReflect(effect);
      case BattleEffectType.SPECIAL_CHARGE_FIZZLE:
        return this.playSpecialChargeFizzle(effect);
      default:
        return Promise.resolve();
    }
  }

  /**
   * ターゲットに対応するテキストオブジェクトを取得
   */
  private getTargetText(target: EffectTarget): Phaser.GameObjects.Text {
    return target === 'player' ? this.targets.playerText : this.targets.enemyText;
  }

  /**
   * ターゲットに対応するエフェクト対象オブジェクトを取得
   * Imageがあればそちらを優先、なければTextにフォールバック
   */
  private getTargetObject(target: EffectTarget): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
    if (target === 'player') {
      return this.targets.playerImage ?? this.targets.playerText;
    }
    return this.targets.enemyImage ?? this.targets.enemyText;
  }

  /**
   * 攻撃者（defenderの反対側）のオブジェクトを取得
   */
  private getAttackerObject(defenderTarget: EffectTarget): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
    return this.getTargetObject(defenderTarget === 'enemy' ? 'player' : 'enemy');
  }

  /**
   * ダメージ数値表示: テキスト生成→上に浮かびながらフェードアウト
   */
  private playDamageNumber(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);
    const damageText = this.scene.add.text(
      targetObj.x,
      targetObj.y - 30,
      `${effect.value}`,
      {
        fontSize: '24px',
        color: EFFECT_CONFIG.damageNumberColor,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    damageText.setOrigin(0.5);

    return new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: damageText,
        y: damageText.y - 40,
        alpha: 0,
        duration: EFFECT_CONFIG.damageNumberDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => {
          damageText.destroy();
          resolve();
        },
      });
    });
  }

  /**
   * 武器攻撃エフェクト: 攻撃者ダッシュ → スラッシュ線 + シェイク → 攻撃者リターン
   */
  private playWeaponAttack(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);
    const attackerObj = this.getAttackerObject(effect.target);
    const originalAttackerX = attackerObj.x;
    const originalTargetX = targetObj.x;
    // 攻撃者が相手に向かって35%の距離をダッシュ
    const dashX = originalAttackerX + (originalTargetX - originalAttackerX) * 0.35;

    playSe(this.scene.sound, AudioKey.SE_ATTACK);

    return new Promise<void>(resolve => {
      // Tween 1: 攻撃者ダッシュ
      this.scene.tweens.add({
        targets: attackerObj,
        x: dashX,
        duration: EFFECT_CONFIG.weaponDashDuration * this.speedMultiplier,
        ease: 'Power2.in',
        onComplete: () => {
          // スラッシュGraphics描画
          const slash = this.scene.add.graphics();
          slash.lineStyle(3, EFFECT_CONFIG.slashColor, 1);
          slash.beginPath();
          slash.moveTo(targetObj.x - 25, targetObj.y - 35);
          slash.lineTo(targetObj.x + 20, targetObj.y + 10);
          slash.moveTo(targetObj.x - 15, targetObj.y - 45);
          slash.lineTo(targetObj.x + 30, targetObj.y);
          slash.strokePath();

          let done = 0;
          const checkDone = () => {
            done++;
            if (done >= 3) {
              targetObj.clearTint();
              resolve();
            }
          };

          // スラッシュフェードアウト
          this.scene.tweens.add({
            targets: slash,
            alpha: 0,
            duration: EFFECT_CONFIG.weaponAttackDuration * this.speedMultiplier / 2,
            ease: 'Power2',
            onComplete: () => {
              slash.destroy();
              checkDone();
            },
          });

          targetObj.setTint(EFFECT_CONFIG.weaponFlashColor);

          // Tween 2: 攻撃者リターン
          this.scene.tweens.add({
            targets: attackerObj,
            x: originalAttackerX,
            duration: EFFECT_CONFIG.weaponAttackDuration * this.speedMultiplier / 2,
            ease: 'Power2.out',
            onComplete: checkDone,
          });

          // Tween 3: ターゲットシェイク
          this.scene.tweens.add({
            targets: targetObj,
            x: originalTargetX + 8,
            duration: EFFECT_CONFIG.weaponAttackDuration * this.speedMultiplier / 4,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.inOut',
            onComplete: () => {
              targetObj.x = originalTargetX;
              checkDone();
            },
          });
        },
      });
    });
  }

  /**
   * 特殊攻撃エフェクト: 溜めグロー → 光球プロジェクタイル飛翔 → 衝撃パルス
   */
  private async playSpecialAttack(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);
    const attackerObj = this.getAttackerObject(effect.target);
    const originalScaleX = targetObj.scaleX;
    const originalScaleY = targetObj.scaleY;

    // Phase 0: 溜め（攻撃者がグロー）
    await new Promise<void>(resolve => {
      attackerObj.setTint(EFFECT_CONFIG.specialChargeColor);
      this.scene.tweens.add({
        targets: attackerObj,
        scaleX: attackerObj.scaleX * 1.15,
        scaleY: attackerObj.scaleY * 1.15,
        duration: EFFECT_CONFIG.specialChargeDuration * this.speedMultiplier,
        yoyo: true,
        onComplete: () => {
          attackerObj.clearTint();
          resolve();
        },
      });
    });

    playSe(this.scene.sound, AudioKey.SE_ATTACK);

    return new Promise<void>(resolve => {
      // 光球プロジェクタイル（Graphics円）を生成
      const orb = this.scene.add.graphics();
      orb.fillStyle(EFFECT_CONFIG.orbGlowColor, 0.5);
      orb.fillCircle(0, 0, 14);
      orb.fillStyle(EFFECT_CONFIG.orbColor, 1);
      orb.fillCircle(0, 0, 8);
      orb.x = attackerObj.x;
      orb.y = attackerObj.y;

      // Tween 1: 光球がターゲットへ飛翔
      this.scene.tweens.add({
        targets: orb,
        x: targetObj.x,
        y: targetObj.y,
        duration: EFFECT_CONFIG.specialProjectileDuration * this.speedMultiplier,
        ease: 'Power2.in',
        onComplete: () => {
          orb.destroy();
          targetObj.setTint(EFFECT_CONFIG.specialPulseColor);

          // 光球命中と同時にダメージ数値を表示
          if (effect.value != null) {
            const damageText = this.scene.add.text(
              targetObj.x,
              targetObj.y - 30,
              `${effect.value}`,
              {
                fontSize: '24px',
                color: EFFECT_CONFIG.damageNumberColor,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
              }
            );
            damageText.setOrigin(0.5);
            this.scene.tweens.add({
              targets: damageText,
              alpha: 0,
              y: damageText.y - 40,
              duration: EFFECT_CONFIG.damageNumberDuration * this.speedMultiplier,
              ease: 'Power2',
              onComplete: () => damageText.destroy(),
            });
          }

          // Tween 2: 衝撃パルス
          this.scene.tweens.add({
            targets: targetObj,
            scaleX: originalScaleX * 1.3,
            scaleY: originalScaleY * 1.3,
            duration: EFFECT_CONFIG.specialAttackDuration * this.speedMultiplier / 2,
            yoyo: true,
            ease: 'Sine.inOut',
            onComplete: () => {
              targetObj.clearTint();
              targetObj.scaleX = originalScaleX;
              targetObj.scaleY = originalScaleY;
              resolve();
            },
          });
        },
      });
    });
  }

  /**
   * リフレクター発動: 青シールドフラッシュ + "REFLECT" テキスト
   */
  private playReflector(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);
    const reflectText = this.scene.add.text(
      targetObj.x,
      targetObj.y - 40,
      'REFLECT',
      {
        fontSize: '20px',
        color: EFFECT_CONFIG.reflectorTextColor,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    reflectText.setOrigin(0.5);

    return new Promise<void>(resolve => {
      targetObj.setTint(EFFECT_CONFIG.reflectorShieldColor);

      this.scene.tweens.add({
        targets: reflectText,
        alpha: 0,
        y: reflectText.y - 20,
        duration: EFFECT_CONFIG.reflectorDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => {
          targetObj.clearTint();
          reflectText.destroy();
          resolve();
        },
      });
    });
  }

  /**
   * 回避エフェクト: 横ステップ + "MISS" テキスト
   */
  private playEvasion(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);
    const originalX = targetObj.x;
    const missText = this.scene.add.text(
      targetObj.x,
      targetObj.y - 30,
      'MISS',
      {
        fontSize: '20px',
        color: EFFECT_CONFIG.evasionTextColor,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    missText.setOrigin(0.5);

    return new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: targetObj,
        x: originalX + (effect.target === 'player' ? -30 : 30),
        duration: EFFECT_CONFIG.evasionDuration * this.speedMultiplier / 2,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          targetObj.x = originalX;
        },
      });

      this.scene.tweens.add({
        targets: missText,
        alpha: 0,
        y: missText.y - 20,
        duration: EFFECT_CONFIG.evasionDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => {
          missText.destroy();
          resolve();
        },
      });
    });
  }

  /**
   * 距離移動アニメーション: キャラクター位置のTween移動
   * Image+Text両方を同時に移動させる
   */
  private playDistanceMove(effect: BattleEffect): Promise<void> {
    if (!effect.distanceTo) return Promise.resolve();

    const newPositions = DISTANCE_CHARACTER_POSITIONS[effect.distanceTo];
    const playerText = this.targets.playerText;
    const enemyText = this.targets.enemyText;
    const playerImage = this.targets.playerImage;
    const enemyImage = this.targets.enemyImage;

    return new Promise<void>(resolve => {
      let completed = 0;
      const totalExpected = 2 + (playerImage ? 1 : 0) + (enemyImage ? 1 : 0);
      const onOneComplete = () => {
        completed++;
        if (completed >= totalExpected) resolve();
      };

      // Text移動
      this.scene.tweens.add({
        targets: playerText,
        x: newPositions.playerX,
        duration: EFFECT_CONFIG.distanceMoveDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: onOneComplete,
      });

      this.scene.tweens.add({
        targets: enemyText,
        x: newPositions.enemyX,
        duration: EFFECT_CONFIG.distanceMoveDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: onOneComplete,
      });

      // Image移動（存在する場合、完了カウントに含める）
      if (playerImage) {
        this.scene.tweens.add({
          targets: playerImage,
          x: newPositions.playerX,
          duration: EFFECT_CONFIG.distanceMoveDuration * this.speedMultiplier,
          ease: 'Power2',
          onComplete: onOneComplete,
        });
      }

      if (enemyImage) {
        this.scene.tweens.add({
          targets: enemyImage,
          x: newPositions.enemyX,
          duration: EFFECT_CONFIG.distanceMoveDuration * this.speedMultiplier,
          ease: 'Power2',
          onComplete: onOneComplete,
        });
      }
    });
  }

  /**
   * リフレクター構えエフェクト: 淡い青盾テキスト（攻撃が来なかった場合）
   */
  private playReflectorDeploy(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);
    const deployText = this.scene.add.text(
      targetObj.x,
      targetObj.y - 40,
      '🛡️',
      {
        fontSize: '22px',
        color: EFFECT_CONFIG.reflectorDeployTextColor,
        fontFamily: 'Arial, sans-serif',
      }
    );
    deployText.setOrigin(0.5);

    return new Promise<void>(resolve => {
      targetObj.setTint(EFFECT_CONFIG.reflectorShieldColor);

      this.scene.tweens.add({
        targets: deployText,
        alpha: 0,
        y: deployText.y - 15,
        duration: EFFECT_CONFIG.reflectorDeployDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => {
          targetObj.clearTint();
          deployText.destroy();
          resolve();
        },
      });
    });
  }

  /**
   * スタンス変更エフェクト: カラーティント + スタンス名テキスト
   */
  private playStanceChange(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);

    let tintColor: number;
    let stanceText: string;
    let textColor: string;

    switch (effect.stanceTo) {
      case StanceType.OFFENSIVE:
        tintColor = EFFECT_CONFIG.stanceOffensiveColor;
        stanceText = '攻勢！';
        textColor = '#ff8800';
        break;
      case StanceType.DEFENSIVE:
        tintColor = EFFECT_CONFIG.stanceDefensiveColor;
        stanceText = '守勢！';
        textColor = '#4488ff';
        break;
      default:
        tintColor = EFFECT_CONFIG.stanceNormalColor;
        stanceText = '通常';
        textColor = '#aaaaaa';
    }

    const stanceLabel = this.scene.add.text(
      targetObj.x,
      targetObj.y - 30,
      stanceText,
      {
        fontSize: '20px',
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    stanceLabel.setOrigin(0.5);
    targetObj.setTint(tintColor);

    return new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: stanceLabel,
        alpha: 0,
        y: stanceLabel.y - 20,
        duration: EFFECT_CONFIG.stanceChangeDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => {
          targetObj.clearTint();
          stanceLabel.destroy();
          resolve();
        },
      });
    });
  }

  /**
   * SPECIAL×REFLECTOR 反射アニメーション（4ステップ連続）
   *
   * ① 攻撃者から光球が防御者へ飛翔
   * ② 防御者が盾を構える（青ティント + 🛡）
   * ③ 光球が反転して攻撃者へ跳ね返る
   * ④ 攻撃者が被弾（フラッシュ + ダメージ数値）
   *
   * effect.target = 防御者（リフレクター保持者）
   * effect.reflectedDamage = 跳ね返り後のダメージ
   */
  private async playSpecialReflect(effect: BattleEffect): Promise<void> {
    const defenderObj = this.getTargetObject(effect.target);
    const attackerTarget: EffectTarget = effect.target === 'player' ? 'enemy' : 'player';
    const attackerObj = this.getTargetObject(attackerTarget);
    const cfg = EFFECT_CONFIG;

    playSe(this.scene.sound, AudioKey.SE_ATTACK);

    // ① 光球: 攻撃者 → 防御者
    await new Promise<void>(resolve => {
      const orb = this.scene.add.graphics();
      orb.fillStyle(cfg.orbGlowColor, 0.5);
      orb.fillCircle(0, 0, 14);
      orb.fillStyle(cfg.orbColor, 1);
      orb.fillCircle(0, 0, 8);
      orb.x = attackerObj.x;
      orb.y = attackerObj.y;

      this.scene.tweens.add({
        targets: orb,
        x: defenderObj.x,
        y: defenderObj.y,
        duration: cfg.specialReflectProjectileDuration * this.speedMultiplier,
        ease: 'Power2.in',
        onComplete: () => { orb.destroy(); resolve(); },
      });
    });

    // ② 防御者が盾を構える
    await new Promise<void>(resolve => {
      const shieldText = this.scene.add.text(
        defenderObj.x,
        defenderObj.y - 45,
        '🛡️',
        { fontSize: '30px', fontFamily: 'Arial, sans-serif' },
      ).setOrigin(0.5);

      defenderObj.setTint(cfg.reflectorShieldColor);

      this.scene.tweens.add({
        targets: shieldText,
        y: shieldText.y - 12,
        duration: cfg.specialReflectShieldDuration * this.speedMultiplier,
        ease: 'Power2.out',
        onComplete: () => {
          defenderObj.clearTint();
          shieldText.destroy();
          resolve();
        },
      });
    });

    // ③ 反射光球: 防御者 → 攻撃者（色を変えて跳ね返り感を演出）
    await new Promise<void>(resolve => {
      const reflectOrb = this.scene.add.graphics();
      reflectOrb.fillStyle(cfg.specialReflectOrbGlowColor, 0.5);
      reflectOrb.fillCircle(0, 0, 12);
      reflectOrb.fillStyle(cfg.specialReflectOrbColor, 1);
      reflectOrb.fillCircle(0, 0, 7);
      reflectOrb.x = defenderObj.x;
      reflectOrb.y = defenderObj.y;

      const reflectLabel = this.scene.add.text(
        defenderObj.x,
        defenderObj.y - 30,
        'REFLECT!',
        {
          fontSize: '18px',
          color: '#ff8844',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);

      this.scene.tweens.add({
        targets: reflectOrb,
        x: attackerObj.x,
        y: attackerObj.y,
        duration: cfg.specialReflectReturnDuration * this.speedMultiplier,
        ease: 'Power2.in',
        onComplete: () => { reflectOrb.destroy(); resolve(); },
      });

      this.scene.tweens.add({
        targets: reflectLabel,
        alpha: 0,
        duration: cfg.specialReflectReturnDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => { reflectLabel.destroy(); },
      });
    });

    // ④ 攻撃者が被弾（フラッシュ + ダメージ数値）
    const originalScaleX = attackerObj.scaleX;
    const originalScaleY = attackerObj.scaleY;
    attackerObj.setTint(cfg.specialPulseColor);

    const damage = effect.reflectedDamage ?? 0;
    if (damage > 0) {
      const damageText = this.scene.add.text(
        attackerObj.x,
        attackerObj.y - 30,
        `${damage}`,
        {
          fontSize: '24px',
          color: cfg.damageNumberColor,
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);

      this.scene.tweens.add({
        targets: damageText,
        y: damageText.y - 40,
        alpha: 0,
        duration: cfg.damageNumberDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => { damageText.destroy(); },
      });
    }

    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: attackerObj,
        scaleX: originalScaleX * 1.25,
        scaleY: originalScaleY * 1.25,
        duration: cfg.specialReflectHitDuration * this.speedMultiplier / 2,
        yoyo: true,
        ease: 'Sine.inOut',
        onComplete: () => {
          attackerObj.clearTint();
          attackerObj.scaleX = originalScaleX;
          attackerObj.scaleY = originalScaleY;
          resolve();
        },
      });
    });
  }

  /**
   * 特殊攻撃が武器攻撃で潰された演出: 溜めグロー → エネルギー散逸（fizzle）
   */
  private async playSpecialChargeFizzle(effect: BattleEffect): Promise<void> {
    const attackerObj = this.getTargetObject(effect.target);
    const cfg = EFFECT_CONFIG;
    const originalScaleX = attackerObj.scaleX;
    const originalScaleY = attackerObj.scaleY;

    // Phase 1: 溜め（グロー）
    await new Promise<void>(resolve => {
      attackerObj.setTint(cfg.specialChargeColor);
      this.scene.tweens.add({
        targets: attackerObj,
        scaleX: originalScaleX * 1.15,
        scaleY: originalScaleY * 1.15,
        duration: cfg.specialChargeDuration * this.speedMultiplier,
        yoyo: true,
        onComplete: () => resolve(),
      });
    });

    // Phase 2: 崩れ（ティントをクリアしてスケール元に戻す）
    await new Promise<void>(resolve => {
      attackerObj.clearTint();
      this.scene.tweens.add({
        targets: attackerObj,
        scaleX: originalScaleX,
        scaleY: originalScaleY,
        duration: cfg.specialChargeFizzleDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * リフレクター残回数切れブロックエフェクト: 淡い灰青テキスト（特殊をブロックしたが反射できなかった場合）
   */
  private playReflectorBlock(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);
    const blockText = this.scene.add.text(
      targetObj.x,
      targetObj.y - 40,
      'GUARD',
      {
        fontSize: '20px',
        color: EFFECT_CONFIG.reflectorBlockTextColor,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    blockText.setOrigin(0.5);

    return new Promise<void>(resolve => {
      targetObj.setTint(EFFECT_CONFIG.reflectorBlockTintColor);

      this.scene.tweens.add({
        targets: blockText,
        alpha: 0,
        y: blockText.y - 15,
        duration: EFFECT_CONFIG.reflectorBlockDuration * this.speedMultiplier,
        ease: 'Power2',
        onComplete: () => {
          targetObj.clearTint();
          blockText.destroy();
          resolve();
        },
      });
    });
  }
}
