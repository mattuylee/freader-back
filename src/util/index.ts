
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