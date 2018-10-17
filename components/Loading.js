import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  View,
  Easing,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  line: {
    height: 5,
    width: 75
  }
})

class Loading extends Component {

  render() {
    const { theme } = this.props;
    if (this.props.loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator  animating size="large" color={theme}/>
        </View>
      )
    }
    return null
  }
}

Loading.propTypes = {
  theme: PropTypes.string.isRequired,
  loading: PropTypes.bool
}

Loading.defaultProps = {
  loading: true
}

export { Loading }
