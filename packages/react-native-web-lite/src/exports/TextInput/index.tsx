/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react'

import * as forwardedProps from '../../modules/forwardedProps/index.js'
import pick from '../../modules/pick/index.js'
import TextInputState from '../../modules/TextInputState/index.js'
import useElementLayout from '../../modules/useElementLayout/index.js'
import useLayoutEffect from '../../modules/useLayoutEffect/index.js'
import { getLocaleDirection, useLocaleContext } from '../../modules/useLocale/index.js'
import { useMergeRefs } from '../../modules/useMergeRefs/index.js'
import usePlatformMethods from '../../modules/usePlatformMethods/index.js'
import useResponderEvents from '../../modules/useResponderEvents/index.js'
import type { PlatformMethods } from '../../types.js'
import createElement from '../createElement/index.js'
import StyleSheet from '../StyleSheet/index.js'
import type { TextInputProps } from './types.js'

/**
 * Determines whether a 'selection' prop differs from a node's existing
 * selection state.
 */
const isSelectionStale = (node, selection) => {
  const { selectionEnd, selectionStart } = node
  const { start, end } = selection
  return start !== selectionStart || end !== selectionEnd
}

/**
 * Certain input types do no support 'selectSelectionRange' and will throw an
 * error.
 */
const setSelection = (node, selection) => {
  if (isSelectionStale(node, selection)) {
    const { start, end } = selection
    try {
      node.setSelectionRange(start, end || start)
    } catch (e) {
      // ok
    }
  }
}

const forwardPropsList = Object.assign(
  {},
  forwardedProps.defaultProps,
  forwardedProps.accessibilityProps,
  forwardedProps.clickProps,
  forwardedProps.focusProps,
  forwardedProps.keyboardProps,
  forwardedProps.mouseProps,
  forwardedProps.touchProps,
  forwardedProps.styleProps,
  {
    autoCapitalize: true,
    autoComplete: true,
    autoCorrect: true,
    autoFocus: true,
    defaultValue: true,
    disabled: true,
    lang: true,
    maxLength: true,
    onChange: true,
    onScroll: true,
    placeholder: true,
    pointerEvents: true,
    readOnly: true,
    rows: true,
    spellCheck: true,
    value: true,
    type: true,
  }
)

const pickProps = (props) => pick(props, forwardPropsList)

// If an Input Method Editor is processing key input, the 'keyCode' is 229.
// https://www.w3.org/TR/uievents/#determine-keydown-keyup-keyCode
function isEventComposing(nativeEvent) {
  return nativeEvent.isComposing || nativeEvent.keyCode === 229
}

let focusTimeout: number | null = null

const TextInput = React.forwardRef<HTMLElement & PlatformMethods, TextInputProps>(
  (props, forwardedRef) => {
    const {
      autoCapitalize = 'sentences',
      autoComplete,
      autoCompleteType,
      autoCorrect = true,
      blurOnSubmit,
      clearTextOnFocus,
      dir,
      editable = true,
      keyboardType = 'default',
      multiline = false,
      numberOfLines = 1,
      onBlur,
      onChange,
      onChangeText,
      onContentSizeChange,
      onFocus,
      onKeyPress,
      onLayout,
      onMoveShouldSetResponder,
      onMoveShouldSetResponderCapture,
      onResponderEnd,
      onResponderGrant,
      onResponderMove,
      onResponderReject,
      onResponderRelease,
      onResponderStart,
      onResponderTerminate,
      onResponderTerminationRequest,
      onScrollShouldSetResponder,
      onScrollShouldSetResponderCapture,
      onSelectionChange,
      onSelectionChangeShouldSetResponder,
      onSelectionChangeShouldSetResponderCapture,
      onStartShouldSetResponder,
      onStartShouldSetResponderCapture,
      onSubmitEditing,
      placeholderTextColor,
      returnKeyType,
      secureTextEntry = false,
      selection,
      selectTextOnFocus,
      spellCheck,
    } = props

    let type
    let inputMode

    switch (keyboardType) {
      case 'email-address':
        type = 'email'
        break
      case 'number-pad':
      case 'numeric':
        inputMode = 'numeric'
        break
      // @ts-ignore
      case 'decimal-pad':
        inputMode = 'decimal'
        break
      case 'phone-pad':
        type = 'tel'
        break
      case 'search':
      case 'web-search':
        type = 'search'
        break
      case 'url':
        type = 'url'
        break
      default:
        type = 'text'
    }

    if (secureTextEntry) {
      type = 'password'
    }

    const dimensions = React.useRef({ height: null, width: null })
    const hostRef = React.useRef(null)

    const handleContentSizeChange = React.useCallback(
      (hostNode) => {
        if (multiline && onContentSizeChange && hostNode != null) {
          const newHeight = hostNode.scrollHeight
          const newWidth = hostNode.scrollWidth
          if (newHeight !== dimensions.current.height || newWidth !== dimensions.current.width) {
            dimensions.current.height = newHeight
            dimensions.current.width = newWidth
            onContentSizeChange({
              nativeEvent: {
                contentSize: {
                  height: dimensions.current.height,
                  width: dimensions.current.width,
                },
              },
            })
          }
        }
      },
      [multiline, onContentSizeChange]
    )

    const imperativeRef = React.useMemo(
      () => (hostNode) => {
        // TextInput needs to add more methods to the hostNode in addition to those
        // added by `usePlatformMethods`. This is temporarily until an API like
        // `TextInput.clear(hostRef)` is added to React Native.
        if (hostNode != null) {
          hostNode.clear = function () {
            if (hostNode != null) {
              hostNode.value = ''
            }
          }
          hostNode.isFocused = function () {
            return hostNode != null && TextInputState.currentlyFocusedField() === hostNode
          }
          handleContentSizeChange(hostNode)
        }
      },
      [handleContentSizeChange]
    )

    function handleBlur(e) {
      TextInputState._currentlyFocusedNode = null
      if (onBlur) {
        e.nativeEvent.text = e.target.value
        onBlur(e)
      }
    }

    function handleChange(e) {
      const hostNode = e.target
      const text = hostNode.value
      e.nativeEvent.text = text
      handleContentSizeChange(hostNode)
      if (onChange) {
        onChange(e)
      }
      if (onChangeText) {
        onChangeText(text)
      }
    }

    function handleFocus(e) {
      const hostNode = e.target
      if (onFocus) {
        e.nativeEvent.text = hostNode.value
        onFocus(e)
      }
      if (hostNode != null) {
        TextInputState._currentlyFocusedNode = hostNode
        if (clearTextOnFocus) {
          hostNode.value = ''
        }
        if (selectTextOnFocus) {
          // Safari requires selection to occur in a setTimeout
          if (focusTimeout != null) {
            clearTimeout(focusTimeout)
          }
          // @ts-ignore
          focusTimeout = setTimeout(() => {
            if (hostNode != null) {
              hostNode.select()
            }
          }, 0)
        }
      }
    }

    function handleKeyDown(e) {
      const hostNode = e.target
      // Prevent key events bubbling (see #612)
      e.stopPropagation()

      const blurOnSubmitDefault = !multiline
      const shouldBlurOnSubmit = blurOnSubmit == null ? blurOnSubmitDefault : blurOnSubmit

      const nativeEvent = e.nativeEvent
      const isComposing = isEventComposing(nativeEvent)

      if (onKeyPress) {
        onKeyPress(e)
      }

      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        // Do not call submit if composition is occuring.
        !isComposing &&
        !e.isDefaultPrevented()
      ) {
        if ((blurOnSubmit || !multiline) && onSubmitEditing) {
          // prevent "Enter" from inserting a newline or submitting a form
          e.preventDefault()
          nativeEvent.text = e.target.value
          onSubmitEditing(e)
        }
        if (shouldBlurOnSubmit && hostNode != null) {
          hostNode.blur()
        }
      }
    }

    function handleSelectionChange(e) {
      if (onSelectionChange) {
        try {
          const node = e.target
          const { selectionStart, selectionEnd } = node
          e.nativeEvent.selection = {
            start: selectionStart,
            end: selectionEnd,
          }
          e.nativeEvent.text = e.target.value
          onSelectionChange(e)
        } catch (e) {
          // ok
        }
      }
    }

    useLayoutEffect(() => {
      const node = hostRef.current
      if (node != null && selection != null) {
        setSelection(node, selection)
      }
      if (document.activeElement === node) {
        TextInputState._currentlyFocusedNode = node
      }
    }, [hostRef, selection])

    const component = multiline ? 'textarea' : 'input'

    useElementLayout(hostRef, onLayout)
    useResponderEvents(hostRef, {
      onMoveShouldSetResponder,
      onMoveShouldSetResponderCapture,
      onResponderEnd,
      onResponderGrant,
      onResponderMove,
      onResponderReject,
      onResponderRelease,
      onResponderStart,
      onResponderTerminate,
      onResponderTerminationRequest,
      onScrollShouldSetResponder,
      onScrollShouldSetResponderCapture,
      onSelectionChangeShouldSetResponder,
      onSelectionChangeShouldSetResponderCapture,
      onStartShouldSetResponder,
      onStartShouldSetResponderCapture,
    })
    const { direction: contextDirection } = useLocaleContext()

    const supportedProps = pickProps(props) as any
    supportedProps.autoCapitalize = autoCapitalize
    supportedProps.autoComplete = autoComplete || autoCompleteType || 'on'
    supportedProps.autoCorrect = autoCorrect ? 'on' : 'off'
    // 'auto' by default allows browsers to infer writing direction
    supportedProps.dir = dir !== undefined ? dir : 'auto'
    supportedProps.enterKeyHint = returnKeyType
    supportedProps.inputMode = inputMode
    supportedProps.onBlur = handleBlur
    supportedProps.onChange = handleChange
    supportedProps.onFocus = handleFocus
    supportedProps.onKeyDown = handleKeyDown
    supportedProps.onSelect = handleSelectionChange
    supportedProps.readOnly = !editable
    supportedProps.rows = multiline ? numberOfLines : undefined
    supportedProps.spellCheck = spellCheck != null ? spellCheck : autoCorrect
    supportedProps.style = [
      { '--placeholderTextColor': placeholderTextColor },
      styles.textinput$raw,
      styles.placeholder,
      props.style,
    ]
    supportedProps.type = multiline ? undefined : type

    const platformMethodsRef = usePlatformMethods(supportedProps)

    const setRef = useMergeRefs(hostRef, platformMethodsRef, imperativeRef, forwardedRef)

    supportedProps.ref = setRef

    const langDirection = props.lang != null ? getLocaleDirection(props.lang) : null
    const componentDirection = props.dir || langDirection
    const writingDirection = componentDirection || contextDirection

    const element = createElement(component, supportedProps, {
      writingDirection,
    })

    return element
  }
)

TextInput.displayName = 'TextInput'
// @ts-ignore
TextInput.State = TextInputState

const styles = StyleSheet.create({
  textinput$raw: {
    MozAppearance: 'textfield',
    WebkitAppearance: 'none',
    backgroundColor: 'transparent',
    border: '0 solid black',
    borderRadius: 0,
    boxSizing: 'border-box',
    font: '14px System',
    margin: 0,
    padding: 0,
    resize: 'none',
  },
  placeholder: {
    placeholderTextColor: 'var(--placeholderTextColor)',
  },
})

export default TextInput
