/**
 * Copyright (c) Nicolas Gallagher.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import React from 'react'

import AccessibilityUtil from '../../modules/AccessibilityUtil/index.js'
import createDOMProps from '../../modules/createDOMProps/index.js'
import { LocaleProvider } from '../../modules/useLocale/index.js'

const createElement = (component, props, options?) => {
  // Use equivalent platform elements where possible.
  let accessibilityComponent
  if (component && component.constructor === String) {
    accessibilityComponent = AccessibilityUtil.propsToAccessibilityComponent(props)
  }
  const Component = accessibilityComponent || component
  const domProps = createDOMProps(Component, props, options)

  const element = React.createElement(Component, domProps)

  // Update locale context if element's writing direction prop changes
  const elementWithLocaleProvider = domProps.dir ? (
    <LocaleProvider direction={domProps.dir} locale={domProps.lang}>
      {element}
    </LocaleProvider>
  ) : (
    element
  )

  return elementWithLocaleProvider
}

export default createElement
