
import _globalConfig = require('./global-config');
export const globalConfig = _globalConfig

import trim = require('./entity-trimer')
export const trimEntity = trim

import _filter = require('./response-filter');
export const filterResponse = _filter

import _setPrototype = require('./prototype-setter');
export const setPrototype = _setPrototype

import _validate = require('./validatior');
export const validate = _validate

import { _createRandomCode, _hash } from './random-encoder'
export const createRandomCode = _createRandomCode
export const hash = _hash


/**
 * 格式化时间
 * @param time 时间，允许字符串或时间戳
 * @param format 输出格式
 * @param format.chineseFull 中文年月日 HH:MM:SS
 * @param format.chineseDate 中文年月日
 * @param format.englishFull YYYY-MM-DD hh:mm:ss
 * @param format.englishDate YYYY-MM-DD
 * 
 */
export function formatTime(time, format: string) {
    let t = new Date(time)
    switch (format) {
        case 'chineseFull':
            return `${t.getFullYear()}年${t.getMonth() + 1}月${t.getDay()}日 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`
        case 'chineseDate':
            return `${t.getFullYear()}年${t.getMonth() + 1}月${t.getDay()}日`
        case 'englishFull':
            return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDay()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`
        case 'englishDate':
            return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDay()).padStart(2, '0')}`
        default:
            return t.toString()
    }
}