import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  BackHandler,
  Animated,
  Image,
  Platform,
  Alert,
  View,
} from 'react-native'
import VideoPlayer from 'react-native-video'
import KeepAwake from 'react-native-keep-awake'
import Orientation from 'react-native-orientation'
import Icons from 'react-native-vector-icons/MaterialIcons'
import { Controls } from './'
import { checkSource } from './utils'
const Win = Dimensions.get('window')
const backgroundColor = '#000'

const styles = StyleSheet.create({
  background: {
    backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 98
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    zIndex: 99
  }
})

const defaultTheme = {
  title: '#FFF',
  more: '#FFF',
  center: '#FFF',
  fullscreen: '#FFF',
  volume: '#FFF',
  scrubberThumb: '#FFF',
  scrubberBar: '#FFF',
  seconds: '#FFF',
  duration: '#FFF',
  progress: '#FFF',
  loading: '#FFF'
}

class Video extends Component {
  constructor(props) {
    super(props)
    this.state = {
      paused: !props.autoPlay,
      muted: false,
      fullScreen: false,
      inlineHeight: Win.width * 0.5625,
      fullScreenHeight: Win.width < Win.height ? Win.width : Win.height,
      fullScreenWidth: Win.width > Win.height ? Win.width : Win.height,
      loading: false,
      duration: 0,
      progress: 0,
      currentTime: 0,
      seeking: false,
      renderError: false
    }
    this.animInline = new Animated.Value(Win.width * 0.5625);
    this.inlineHeight = Win.width * 0.5625;
    this.animFullscreen = new Animated.Value(Win.width * 0.5625)
    this.BackHandler = this.BackHandler.bind(this)
    this.onRotated = this.onRotated.bind(this);
    this.id = Math.random();
  }

  componentDidMount() {
    Dimensions.addEventListener('change', this.onRotated)
    BackHandler.addEventListener('hardwareBackPress', this.BackHandler);
    Orientation.getOrientation((err, orientation) => {
      console.log({orientation, start:this.props.startMode }, "startmode");
      if(orientation === "LANDSCAPE" ||  this.props.startMode === "fullscreen") {
        if (Platform.OS === "ios") {
          Orientation.lockToLandscapeRight();
        } else {
          requestAnimationFrame(() =>{
            Orientation.lockToLandscape();
          });
        }
        this.setState({ fullScreen: true, manualToggle: true }, () => {
          this.props.onFullScreen(this.state.fullScreen);
        });
      }
    });
  }

  componentWillUnmount() {
    if(this.pendingTimer) {
      clearTimeout(this.pendingTimer);
    }
    Dimensions.removeEventListener('change', this.onRotated)
    BackHandler.removeEventListener('hardwareBackPress', this.BackHandler)
  }

  onLoadStart() {
    this.setState({ paused: true, loading: true });
    this.props.onLoadStart();
  }

  onLoad(data) {
    if (!this.state.loading) return
    this.props.onLoad(data);
    const { height, width } = data.naturalSize
    const ratio = height === 'undefined' && width === 'undefined' ?
      (9 / 16) : (height / width)
    const inlineHeight = this.props.lockRatio ?
      (Win.width / this.props.lockRatio)
      : (Win.width * ratio)
    this.setState({
      paused: !this.props.autoPlay,
      loading: false,
      inlineHeight,
      duration: data.duration
    }, () => {
      //Animated.timing(this.animInline, { toValue: inlineHeight, duration: 200 }).start()
      this.props.onPlay(!this.state.paused)
      if (!this.state.paused) {
        KeepAwake.activate()
        if (this.props.fullScreenOnly) {
          this.setState({ fullScreen: true }, () => {
            this.props.onFullScreen(this.state.fullScreen)
            this.animToFullscreen(Win.height)
            if (this.props.rotateToFullScreen) {
              if (Platform.OS === "ios") {
                Orientation.lockToLandscapeRight();
              } else {
                Orientation.lockToLandscape();
              }
            }
          })
        }
      }
    })
  }

  onBuffer(a) {
    this.props.onBuffer(a);
    //this.setState({ loading: true, paused: true })
  }

  onEnd() {
    this.props.onEnd()
    const { loop } = this.props
    if (!loop) this.pause()
    this.onSeekRelease(0)
    this.setState({ currentTime: 0 }, () => {
      if (!loop) this.controls.showControls()
    })
  }

  onRotated({ window: { width, height } }) {
    Orientation.getOrientation((err, orientation) => {
      if(err) {
        orientation = width > height ? "LANDSCAPE" : "PORTRAIT";
      }
      const { manualToggle } = this.state;
      if (orientation === 'LANDSCAPE') {
        this.setState({ manualToggle: false, fullScreen: true, fullScreenHeight: height, }, () => {
          //this.animToFullscreen(height)
          this.props.onFullScreen(this.state.fullScreen);
        });
        return;
      }
      if (orientation === 'PORTRAIT') {
          this.setState({
            fullScreen: false,
            manualToggle: false,
          }, () => {
            if(this.pendingTimer) {
              clearTimeout(this.pendingTimer);
            }
            this.pendingTimer = setTimeout(() =>{
              this.pendingTimer = null;
              //wait for user to turn screen to potrait. Otherwise
               Orientation.unlockAllOrientations();
            },4000);
            this.props.onFullScreen(this.state.fullScreen)
          });
          return
        }
    });
  }

  onSeekRelease(percent) {
    const seconds = percent * this.state.duration;
    const oldProgress = this.state.progress;
    this.setState({ progress: percent, seeking: false }, () => {
      this.player.seek(seconds);
      this.props.onSeekRelease({
        progress: percent,
        oldProgress,
        duration: this.state.duration,
      });
    })
  }

  onError(msg) {
    this.props.onError(msg)
    const { error } = this.props
  }

  BackHandler() {
    if (this.state.fullScreen) {
      this.setState({ fullScreen: false }, () => {
        this.animToInline()
        this.props.onFullScreen(this.state.fullScreen)
        if (this.props.fullScreenOnly && !this.state.paused) this.togglePlay()
        if (this.props.rotateToFullScreen) Orientation.lockToPortrait()
        if (!this.props.lockPortraitOnFsExit) {
          Orientation.unlockAllOrientations();
        }
      })
      return true
    }
    return false
  }

  pause() {
    if (!this.state.paused) this.togglePlay()
  }

  play() {
    if (this.state.paused) this.togglePlay()
  }

  togglePlay() {
    this.setState({ paused: !this.state.paused }, () => {
      this.props.onPlay(!this.state.paused)
      if (!this.state.paused) {
        KeepAwake.activate()
      } else {
        KeepAwake.deactivate()
      }
    })
  }

  toggleFS() {
    let manualToggle = true;
    this.setState({
      manualToggle
    }, () => {
      if (this.state.fullScreen) {
        Orientation.lockToPortrait();
      } else {
        if (Platform.OS === "ios") {
          Orientation.lockToLandscapeRight();
        } else {
          Orientation.lockToLandscape();
        }
      }
    });
  }

  animToFullscreen(height) {
    return;
    Animated.parallel([
      Animated.timing(this.animFullscreen, { toValue: height, duration: 200 }),
      Animated.timing(this.animInline, { toValue: height, duration: 200 })
    ]).start()
  }

  animToInline(height) {
    return;
    const newHeight = height || this.state.inlineHeight
    Animated.parallel([
      Animated.timing(this.animFullscreen, { toValue: newHeight, duration: 100 }),
      Animated.timing(this.animInline, { toValue: this.state.inlineHeight, duration: 100 })
    ]).start()
  }

  toggleMute() {
    this.setState({ muted: !this.state.muted })
  }

  seek(percent) {
    const currentTime = percent * this.state.duration
    this.setState({ seeking: true, currentTime })
  }

  seekTo(seconds) {
    const percent = seconds / this.state.duration
    if (seconds > this.state.duration) {
      return false
    }
    return this.onSeekRelease(percent)
  }

  progress(time) {
    const { currentTime } = time
    const progress = currentTime / this.state.duration
    if (!this.state.seeking) {
      this.setState({ progress, currentTime }, () => {
        this.props.onProgress(time)
      })
    }
  }

  renderError() {
    const { fullScreen } = this.state
    const inline = {
      height: this.animInline,
      alignSelf: 'stretch'
    }
    const textStyle = { color: 'white', padding: 10 }
    return (
      <Animated.View
        style={[styles.background, fullScreen ? styles.fullScreen : inline]}
      >
        <Text style={textStyle}>Retry</Text>
        <Icons
          name="replay"
          size={60}
          color={this.props.theme}
          onPress={() => this.setState({ renderError: false })}
        />
      </Animated.View>
    )
  }

  renderPlayer() {
    const {
      fullScreen,
      paused,
      muted,
      loading,
      progress,
      duration,
      inlineHeight,
      currentTime
    } = this.state

    const {
      url,
      loop,
      title,
      logo,
      rate,
      style,
      volume,
      placeholder,
      theme,
      onTimedMetadata,
      resizeMode,
      onMorePress,
      inlineOnly,
      onNextPress,
      disableSeek,
      playInBackground,
      playWhenInactive
    } = this.props

    const inline = {
      height: inlineHeight,
      alignSelf: 'stretch'
    }

    const setTheme = {
      ...defaultTheme,
      ...theme
    }

    return (
      <View
        style={[
          styles.background,
          fullScreen ?
            (styles.fullScreen, { height: this.state.fullScreenHeight, width: this.state.fullScreenWidth })
            : { height: this.state.inlineHeight },
          fullScreen ? null : style
        ]}
      >
        <StatusBar hidden={fullScreen} />
        {
          ((loading && placeholder)) &&
          <Image resizeMode="cover" style={styles.image} {...checkSource(placeholder)} />
        }
        <VideoPlayer
          {...checkSource(url)}
          paused={paused}
          resizeMode={resizeMode}
          repeat={loop}
          style={fullScreen ? (styles.fullScreen, { height: this.state.fullScreenHeight, width: this.state.fullScreenWidth }) : inline}
          ref={(ref) => { this.player = ref }}
          rate={rate}
          volume={volume}
          muted={muted}
          playInBackground={playInBackground} // Audio continues to play when app entering background.
          playWhenInactive={playWhenInactive} // [iOS] Video continues to play when control or notification center are shown.
          // progressUpdateInterval={250.0}          // [iOS] Interval to fire onProgress (default to ~250ms)
          onLoadStart={() => this.onLoadStart()} // Callback when video starts to load
          onLoad={e => this.onLoad(e)} // Callback when video loads
          onProgress={e => this.progress(e)} // Callback every ~250ms with currentTime
          onEnd={() => this.onEnd()}
          onError={e => this.onError(e)}
          onBuffer={() => this.onBuffer()} // Callback when remote video is buffering
          onTimedMetadata={e => onTimedMetadata(e)} // Callback when the stream receive some metadata
        />
        <Controls
          ref={(ref) => { this.controls = ref }}
          toggleMute={() => this.toggleMute()}
          toggleFS={() => this.toggleFS()}
          togglePlay={() => this.togglePlay()}
          paused={paused}
          muted={muted}
          disableSeek={disableSeek}
          fullscreen={fullScreen}
          loading={loading}
          onSeek={val => this.seek(val)}
          onSeekRelease={pos => this.onSeekRelease(pos)}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          logo={logo}
          title={title}
          next={!!onNextPress}
          onNextPress={onNextPress}
          more={!!onMorePress}
          onMorePress={() => onMorePress()}
          theme={setTheme}
          inlineOnly={inlineOnly}
        />
      </View>
    )
  }

  render() {
    if (this.state.renderError) return this.renderError()
    return this.renderPlayer()
  }
}

Video.propTypes = {
  url: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  placeholder: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  style: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.number
  ]),
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object
  ]),
  loop: PropTypes.bool,
  startMode: PropTypes.oneOf(["inline", "fullscreen"]),
  autoPlay: PropTypes.bool,
  disableSeek: PropTypes.bool,
  inlineOnly: PropTypes.bool,
  fullScreenOnly: PropTypes.bool,
  playInBackground: PropTypes.bool,
  playWhenInactive: PropTypes.bool,
  rotateToFullScreen: PropTypes.bool,
  lockPortraitOnFsExit: PropTypes.bool,
  onNextPress: PropTypes.func,
  onEnd: PropTypes.func,
  onLoad: PropTypes.func,
  onLoadStart: PropTypes.func,
  onPlay: PropTypes.func,
  onError: PropTypes.func,
  onProgress: PropTypes.func,
  onMorePress: PropTypes.func,
  onFullScreen: PropTypes.func,
  onTimedMetadata: PropTypes.func,
  rate: PropTypes.number,
  volume: PropTypes.number,
  lockRatio: PropTypes.number,
  logo: PropTypes.string,
  title: PropTypes.string,
  theme: PropTypes.object,
  resizeMode: PropTypes.string
}

Video.defaultProps = {
  placeholder: undefined,
  style: {},
  error: true,
  loop: false,
  autoPlay: false,
  inlineOnly: false,
  fullScreenOnly: false,
  playInBackground: false,
  playWhenInactive: false,
  rotateToFullScreen: false,
  lockPortraitOnFsExit: false,
  disableSeek: false,
  onSeekRelease: () => { },
  onLoadStart: () => { },
  onBuffer: () => { },
  onEnd: () => { },
  onLoad: () => { },
  onPlay: () => { },
  onError: () => { },
  onProgress: () => { },
  onMorePress: undefined,
  onNextPress: undefined,
  onFullScreen: () => { },
  onTimedMetadata: () => { },
  rate: 1,
  volume: 1,
  lockRatio: undefined,
  logo: undefined,
  title: '',
  theme: defaultTheme,
  resizeMode: 'contain',
  startMode: "inline",
}

export default Video
