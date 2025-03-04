/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

'use strict'

import * as React from 'react'
import { forwardRef, memo, useMemo, useRef, useState } from 'react'

import type { HoverEventsConfig } from '../../modules/useHover/index.js'
import useHover from '../../modules/useHover/index.js'
import { useMergeRefs } from '../../modules/useMergeRefs/index.js'
import StyleSheet from '../StyleSheet/index.js'
import usePressEvents from '../usePressEvents/index.js'
import type { PressResponderConfig } from '../usePressEvents/PressResponder.js'
import type { ViewProps } from '../View/index.js'
import View from '../View/index.js'

export type StateCallbackType = {
  focused: boolean
  hovered: boolean
  pressed: boolean
}

type ViewStyleProp = ViewProps['style']

type Props = ViewProps & {
  children: React.ReactNode | ((state: StateCallbackType) => React.ReactNode)
  // Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.
  delayLongPress?: number | null
  // Duration (in milliseconds) from `onPressStart` is called after pointerdown
  delayPressIn?: number | null
  // Duration (in milliseconds) from `onPressEnd` is called after pointerup.
  delayPressOut?: number | null
  // Whether the press behavior is disabled.
  disabled?: boolean | null
  // Called when the view is hovered
  onHoverIn?: HoverEventsConfig['onHoverStart']
  // Called when the view is no longer hovered
  onHoverOut?: HoverEventsConfig['onHoverEnd']
  // Called when this view's layout changes
  onLayout?: ViewProps['onLayout']
  // Called when a long-tap gesture is detected.
  onLongPress?: PressResponderConfig['onLongPress']
  // Called when a single tap gesture is detected.
  onPress?: PressResponderConfig['onPress']
  // Called when a touch is engaged, before `onPress`.
  onPressIn?: PressResponderConfig['onPressStart']
  // Called when a touch is moving, after `onPressIn`.
  onPressMove?: PressResponderConfig['onPressMove']
  // Called when a touch is released, before `onPress`.
  onPressOut?: PressResponderConfig['onPressEnd']
  style?: ViewStyleProp | ((state: StateCallbackType) => ViewStyleProp)
  /**
   * Used only for documentation or testing (e.g. snapshot testing).
   */
  testOnly_hovered?: boolean | null
  testOnly_pressed?: boolean | null
}

/**
 * Component used to build display components that should respond to whether the
 * component is currently pressed or not.
 */
function Pressable(props: Props, forwardedRef): React.ReactNode {
  const {
    children,
    delayLongPress,
    delayPressIn,
    delayPressOut,
    disabled,
    focusable,
    onBlur,
    onContextMenu,
    onFocus,
    onHoverIn,
    onHoverOut,
    onKeyDown,
    onLongPress,
    onPress,
    onPressMove,
    onPressIn,
    onPressOut,
    style,
    testOnly_hovered,
    testOnly_pressed,
    ...rest
  } = props

  const [hovered, setHovered] = useForceableState(testOnly_hovered === true)
  const [focused, setFocused] = useForceableState(false)
  const [pressed, setPressed] = useForceableState(testOnly_pressed === true)

  const hostRef = useRef(null)
  const setRef = useMergeRefs(forwardedRef, hostRef)

  const pressConfig = useMemo(
    () => ({
      delayLongPress,
      delayPressStart: delayPressIn,
      delayPressEnd: delayPressOut,
      disabled,
      onLongPress,
      onPress,
      onPressChange: setPressed,
      onPressStart: onPressIn,
      onPressMove,
      onPressEnd: onPressOut,
    }),
    [
      delayLongPress,
      delayPressIn,
      delayPressOut,
      disabled,
      onLongPress,
      onPress,
      onPressIn,
      onPressMove,
      onPressOut,
      setPressed,
    ]
  )

  const pressEventHandlers = usePressEvents(hostRef, pressConfig)

  const { onContextMenu: onContextMenuPress, onKeyDown: onKeyDownPress } = pressEventHandlers

  useHover(hostRef, {
    contain: true,
    disabled,
    onHoverChange: setHovered,
    onHoverStart: onHoverIn,
    onHoverEnd: onHoverOut,
  })

  const interactionState = { hovered, focused, pressed }

  const blurHandler = React.useCallback(
    (e) => {
      if (disabled) {
        return
      }
      if (e.nativeEvent.target === hostRef.current) {
        setFocused(false)
        if (onBlur != null) {
          onBlur(e)
        }
      }
    },
    [disabled, hostRef, setFocused, onBlur]
  )

  const focusHandler = React.useCallback(
    (e) => {
      if (disabled) {
        return
      }
      if (e.nativeEvent.target === hostRef.current) {
        setFocused(true)
        if (onFocus != null) {
          onFocus(e)
        }
      }
    },
    [disabled, hostRef, setFocused, onFocus]
  )

  const contextMenuHandler = React.useCallback(
    (e) => {
      if (onContextMenuPress != null) {
        onContextMenuPress(e)
      }
      if (onContextMenu != null) {
        onContextMenu(e)
      }
    },
    [onContextMenu, onContextMenuPress]
  )

  const keyDownHandler = React.useCallback(
    (e) => {
      if (onKeyDownPress != null) {
        onKeyDownPress(e)
      }
      if (onKeyDown != null) {
        onKeyDown(e)
      }
    },
    [onKeyDown, onKeyDownPress]
  )

  return (
    <View
      {...rest}
      {...pressEventHandlers}
      accessibilityDisabled={disabled}
      focusable={!disabled && focusable !== false}
      onBlur={blurHandler}
      onContextMenu={contextMenuHandler}
      onFocus={focusHandler}
      onKeyDown={keyDownHandler}
      pointerEvents={disabled ? 'none' : rest.pointerEvents}
      ref={setRef}
      style={[
        !disabled && styles.root,
        typeof style === 'function' ? style(interactionState) : style,
      ]}
    >
      {typeof children === 'function' ? children(interactionState) : children}
    </View>
  )
}

function useForceableState(forced: boolean): [boolean, (boolean) => void] {
  const [bool, setBool] = useState(false)
  return [bool || forced, setBool]
}

const styles = StyleSheet.create({
  root: {
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
})

const MemoedPressable = memo(forwardRef(Pressable as any))
MemoedPressable.displayName = 'Pressable'

export default MemoedPressable
