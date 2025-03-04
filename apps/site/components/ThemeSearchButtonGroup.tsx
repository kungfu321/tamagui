import { ThemeToggle } from '@components/ThemeToggle'
import React from 'react'
import { TooltipGroup, XGroup } from 'tamagui'

import { ColorToggleButton } from './ColorToggleButton'
import { SearchButton } from './SearchButton'

export function ThemeSearchButtonGroup() {
  return (
    <TooltipGroup delay={{ open: 3000, close: 100 }}>
      <XGroup bordered bc="transparent" borderColor="$borderColorHover" ai="center" size="$3">
        <SearchButton chromeless iconAfter={null} />
        <ThemeToggle chromeless />
        <ColorToggleButton chromeless $sm={{ display: 'none' }} />
      </XGroup>
    </TooltipGroup>
  )
}
