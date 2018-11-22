import React from 'react'
import PropTypes from 'prop-types'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import Icons from 'react-native-vector-icons/MaterialIcons'

const backgroundColor = 'transparent'

const styles = StyleSheet.create({
  nextButton: {
    opacity: 0.9,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    marginRight: 8
  },
})

const NextButton = props => (
  <View style={styles.container}>
    {props.next &&
      <TouchableOpacity
        onPress={() => props.onPress()}
      >
        <Icons
          style={styles.nextButton}
          name="skip-next"
          color={props.theme}
          size={50}
        />
      </TouchableOpacity>
    }

  </View>
)

NextButton.propTypes = {
  onPress: PropTypes.func.isRequired,
  paused: PropTypes.bool.isRequired,
  theme: PropTypes.string.isRequired,
  next: PropTypes.bool.isRequired,
}

export { NextButton }
