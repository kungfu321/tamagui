import { addTheme } from './addTheme'
import { activeThemeManagers } from './hooks/useTheme'
import { ThemeObject } from './types'

export function updateTheme({ name, theme }: { name: string; theme: ThemeObject }) {
  const next = addTheme({ name, theme, insertCSS: true, update: true })

  if (process.env.TAMAGUI_TARGET === 'native') {
    activeThemeManagers.forEach((manager) => {
      if (manager.name === name) {
        manager.update(
          {
            name,
            theme: next.theme,
          },
          true
        )
      }
    })
  }

  return next
}
