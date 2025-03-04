import { YStack, styled } from 'tamagui'

export const FlatBubbleCard = styled(YStack, {
  padding: '$6',
  borderRadius: '$3',
  backgroundColor: '$gray2',
  flex: 1,
  mb: '$4',
  mx: '$2',

  variants: {
    feature: {
      true: {
        minWidth: 500,
      },
    },

    hoverable: {
      true: {
        backgroundColor: 'transparent',
        hoverStyle: {
          backgroundColor: '$gray2',
        },
      },
    },

    highlight: {
      '...': (val) => ({
        backgroundColor: val,
      }),
    },
    // {
    //   // true: {
    //   //   borderWidth: 2,
    //   //   borderColor: '$blue6',
    //   //   // shadowColor: '$blue4',
    //   //   // shadowRadius: 20,
    //   //   // shadowOffset: { height: 3, width: 0 },
    //   // },
    //   // false: {
    //   //   margin: 1,
    //   //   borderWidth: 1,
    //   //   borderColor: '$borderColorPress',
    //   // },
    // },
  },
})
