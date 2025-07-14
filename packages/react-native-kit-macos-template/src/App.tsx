// @ts-nocheck

import { Text } from 'react-native'
import Constants from 'expo-constants'

export function App() {
    return (
        <Text style={{ fontSize: 20, margin: 'auto', maxWidth: '50%' }}>
            Hello from React Native!
            {'\n\n'}
            UI Manager: {global.nativeFabricUIManager ? 'Fabric' : 'Paper'}
            {'\n\n'}
            JS Engine: {global.HermesInternal ? 'Hermes' : 'JSC'}
            {'\n\n'}
            Expo Version: {Constants.expoConfig?.sdkVersion}
            {'\n\n'}
            Expo Modules: {Object.keys(globalThis.expo?.modules).join(', ')}
        </Text>
    )
}
