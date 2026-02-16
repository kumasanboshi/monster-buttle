import Phaser from 'phaser';
import { BattleEffect, BattleEffectType, BattleEffectSequence, EffectTarget } from '../types/BattleEffect';
import { DistanceType } from '../types/Distance';
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
   * 武器攻撃エフェクト: 白フラッシュ + シェイク
   */
  private playWeaponAttack(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);
    const originalX = targetObj.x;

    playSe(this.scene.sound, AudioKey.SE_ATTACK);

    return new Promise<void>(resolve => {
      // フラッシュ: 白く光らせる
      targetObj.setTint(EFFECT_CONFIG.weaponFlashColor);

      this.scene.tweens.add({
        targets: targetObj,
        x: originalX + 5,
        duration: EFFECT_CONFIG.weaponAttackDuration * this.speedMultiplier / 4,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.inOut',
        onComplete: () => {
          targetObj.clearTint();
          targetObj.x = originalX;
          resolve();
        },
      });
    });
  }

  /**
   * 特殊攻撃エフェクト: 紫パルス + スケール拡大縮小
   */
  private playSpecialAttack(effect: BattleEffect): Promise<void> {
    const targetObj = this.getTargetObject(effect.target);

    playSe(this.scene.sound, AudioKey.SE_ATTACK);

    return new Promise<void>(resolve => {
      targetObj.setTint(EFFECT_CONFIG.specialPulseColor);

      this.scene.tweens.add({
        targets: targetObj,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: EFFECT_CONFIG.specialAttackDuration * this.speedMultiplier / 2,
        yoyo: true,
        ease: 'Sine.inOut',
        onComplete: () => {
          targetObj.clearTint();
          targetObj.setScale(1);
          resolve();
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
      const totalExpected = 2;
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

      // Image移動（存在する場合のみ、完了カウントには含めない）
      if (playerImage) {
        this.scene.tweens.add({
          targets: playerImage,
          x: newPositions.playerX,
          duration: EFFECT_CONFIG.distanceMoveDuration * this.speedMultiplier,
          ease: 'Power2',
        });
      }

      if (enemyImage) {
        this.scene.tweens.add({
          targets: enemyImage,
          x: newPositions.enemyX,
          duration: EFFECT_CONFIG.distanceMoveDuration * this.speedMultiplier,
          ease: 'Power2',
        });
      }
    });
  }
}
