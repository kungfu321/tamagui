/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ComponentType, FunctionComponent, ReactNode } from 'react'
import React from 'react'

import { invariant } from '../../modules/invariant.js'
import renderLegacy, { hydrate, hydrateLegacy, render } from '../render/index.js'
import StyleSheet from '../StyleSheet/index.js'
import AppContainer from './AppContainer.js'

export default function renderApplication<Props extends Object>(
  RootComponent: ComponentType<Props>,
  WrapperComponent: FunctionComponent<any> | null = null,
  callback: () => void = () => {},
  options: {
    hydrate: boolean
    initialProps: Props
    mode: 'concurrent' | 'legacy'
    rootTag: any
  }
) {
  const { hydrate: shouldHydrate, initialProps, mode, rootTag } = options
  const renderFn = shouldHydrate
    ? mode === 'concurrent'
      ? hydrate
      : hydrateLegacy
    : mode === 'concurrent'
    ? render
    : renderLegacy

  invariant(rootTag, 'Expect to have a valid rootTag, instead got ', rootTag)

  return renderFn(
    <AppContainer WrapperComponent={WrapperComponent} ref={callback} rootTag={rootTag}>
      <RootComponent {...initialProps} />
    </AppContainer>,
    rootTag
  )
}

export function getApplication(
  RootComponent: ComponentType<Object>,
  initialProps: Object,
  WrapperComponent?: FunctionComponent<any> | null
): {
  element: ReactNode
  getStyleElement: (object: Object) => ReactNode
} {
  const element = (
    <AppContainer WrapperComponent={WrapperComponent} rootTag={{}}>
      <RootComponent {...initialProps} />
    </AppContainer>
  )
  // Don't escape CSS text
  const getStyleElement = (props) => {
    const sheet = StyleSheet.getSheet()
    return (
      <style {...props} dangerouslySetInnerHTML={{ __html: sheet.textContent }} id={sheet.id} />
    )
  }
  return { element, getStyleElement }
}
