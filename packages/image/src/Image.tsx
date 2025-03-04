import { GetProps, StackProps, getExpandedShorthands, isWeb, styled } from '@tamagui/core'
import React from 'react'
import { Image as RNImage } from 'react-native'

React['createElement']

const StyledImage = styled(
  RNImage,
  {
    name: 'Image',
    position: 'relative',
    source: { uri: '' },
    zIndex: 1,
  },
  {
    inlineProps: new Set(['src', 'width', 'height']),
  }
)

type StyledImageProps = GetProps<typeof StyledImage>

type BaseProps = Omit<StyledImageProps, 'source' | 'width' | 'height' | 'style' | 'onLayout'> & {
  width: number | string
  height: number | string
  src: string | StyledImageProps['source']
}

export type ImageProps = BaseProps & Omit<StackProps, keyof BaseProps>

export const Image: React.FC<ImageProps> = StyledImage.extractable((inProps) => {
  const props = getExpandedShorthands(inProps)
  const { src, width, height, ...rest } = props
  const source = typeof src === 'string' ? { uri: src, ...(isWeb && { width, height }) } : src
  const defaultSource = Array.isArray(source) ? source[0] : source

  if (!defaultSource) {
    // placeholder with customizability
    return null
  }

  // must set defaultSource to allow SSR, default it to the same as src
  return (
    <StyledImage
      {...(!isWeb && { style: { width, height } })}
      defaultSource={defaultSource}
      source={source}
      {...(rest as any)}
    />
  )
})
