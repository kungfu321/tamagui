/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import canUseDOM from '../../modules/canUseDom/index.js'
import { invariant } from '../../modules/invariant.js'

// Android 4.4 browser
const isPrefixed =
  // eslint-disable-next-line no-prototype-builtins
  canUseDOM && !document.hasOwnProperty('hidden') && document.hasOwnProperty('webkitHidden')

const EVENT_TYPES = ['change', 'memoryWarning']
const VISIBILITY_CHANGE_EVENT = isPrefixed ? 'webkitvisibilitychange' : 'visibilitychange'
const VISIBILITY_STATE_PROPERTY = isPrefixed ? 'webkitVisibilityState' : 'visibilityState'

const AppStates = {
  BACKGROUND: 'background',
  ACTIVE: 'active',
}

class EventEmitter {
  listeners = {}

  addListener(type: string, handler: Function) {
    this.listeners[type] ??= new Set()
    this.listeners[type].add(handler)
  }

  emit(type: string, state: any) {
    this.listeners[type]?.forEach((cb) => cb(state))
  }

  removeListener(type: string, handler: Function) {
    this.listeners[type]?.delete(handler)
  }
}

let hasBoundVisibilityChangeEvent = false

const changeEmitter = new EventEmitter()

export default class AppState {
  static isAvailable = canUseDOM && document[VISIBILITY_STATE_PROPERTY]

  static get currentState() {
    if (!AppState.isAvailable) {
      return AppStates.ACTIVE
    }

    switch (document[VISIBILITY_STATE_PROPERTY]) {
      case 'hidden':
      case 'prerender':
      case 'unloaded':
        return AppStates.BACKGROUND
      default:
        return AppStates.ACTIVE
    }
  }

  static addEventListener(type: string, handler: Function) {
    if (AppState.isAvailable) {
      invariant(
        EVENT_TYPES.indexOf(type) !== -1,
        'Trying to subscribe to unknown event: "%s"',
        type
      )
      if (type === 'change') {
        if (!hasBoundVisibilityChangeEvent) {
          hasBoundVisibilityChangeEvent = true
          document.addEventListener(
            VISIBILITY_CHANGE_EVENT,
            () => {
              if (changeEmitter) {
                changeEmitter.emit('change', AppState.currentState)
              }
            },
            false
          )
        }
        return changeEmitter.addListener(type, handler)
      }
    }
  }

  static removeEventListener(type: string, handler: Function) {
    if (AppState.isAvailable) {
      // eslint-disable-next-line no-console
      console.error(
        `AppState.removeListener('${type}', ...): Method has been ` +
          'deprecated. Please instead use `remove()` on the subscription ' +
          'returned by `AppState.addEventListener`.'
      )
      invariant(
        EVENT_TYPES.indexOf(type) !== -1,
        'Trying to remove listener for unknown event: "%s"',
        type
      )
      if (type === 'change' && changeEmitter) {
        changeEmitter.removeListener(type, handler)
      }
    }
  }
}
