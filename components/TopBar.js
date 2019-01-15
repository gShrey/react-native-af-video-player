import React from 'react'
import PropTypes from 'prop-types'

import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableWithoutFeedback as Touchable
} from 'react-native'

import LinearGradient from 'react-native-linear-gradient'
import { ToggleIcon } from './'
import { checkSource } from './utils'

const backgroundColor = 'transparent'

const styles = StyleSheet.create({
  container: {
    height: 35
  },
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: "space-between"
  },
  title: {
    flex: 1,
    backgroundColor,
    paddingLeft: 10,
    paddingRight: 35,
    fontSize: 16
  },
  logo: {
    marginLeft: 5,
    height: 25,
    width: 25
  }
})

const TopBar = (props) => {
  const {
    logo,
    more,
    title,
    theme,
    onMorePress,
    shareSettings,
    fullscreen
  } = props
  return (
    <LinearGradient colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0)']} style={styles.container}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          { logo && <Image style={styles.logo} resizeMode="contain" {...checkSource(logo)} />}
        </View>
        <Touchable onPress={() => shareSettings.onPress()} style={{ marginTop: 5, alignSelf: "flex-end" }}>
            <View>
              {shareSettings.render({ fullscreen })}
            </View>
        </Touchable>
      </View>
    </LinearGradient>
  )
}

TopBar.propTypes = {
  title: PropTypes.string.isRequired,
  logo: PropTypes.string.isRequired,
  more: PropTypes.bool.isRequired,
  onMorePress: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired
}

export { TopBar }
