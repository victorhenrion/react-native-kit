import { AppRegistry, NativeEventEmitter, NativeModules } from 'react-native'
import { Hello } from './src/Hello'

const { RNEventEmitter } = NativeModules
const eventEmitter = new NativeEventEmitter(NativeModules)

if (RNEventEmitter && typeof RNEventEmitter.sendEventToNative === 'function') {
    RNEventEmitter.sendEventToNative('register')
}

eventEmitter.addListener('buttonClicked', (event) => {
    console.log('Received buttonClicked event', event)
})

AppRegistry.registerComponent('Hello', () => Hello)
