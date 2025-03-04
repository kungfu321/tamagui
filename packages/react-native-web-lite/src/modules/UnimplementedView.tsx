import React from 'react'

import View from '../exports/View'

export default class UnimplementedView extends React.Component {
  setNativeProps = () => {}
  render() {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Unimplemented view`)
    }
    return <View {...this.props} />
  }
}
