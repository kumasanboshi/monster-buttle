import { ROOM_ID_LENGTH } from '../config';

/**
 * 紛らわしい文字（0, O, 1, l, I）を除いた英数字
 */
const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Room IDを生成する
 *
 * @param length - IDの長さ（デフォルト: ROOM_ID_LENGTH）
 * @returns 生成されたRoom ID
 */
export function generateRoomId(length: number = ROOM_ID_LENGTH): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}
