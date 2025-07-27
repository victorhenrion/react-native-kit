import { Text } from 'react-native'
import Constants from 'expo-constants'
import { multiply } from 'speed-lib'

const {
    nativeFabricUIManager,
    HermesInternal,
    expo,
} = globalThis as { expo?: { modules?: object }; [k: string]: unknown }

export function App() {
    return (
        <Text style={{ fontSize: 20, margin: 'auto', maxWidth: '50%' }}>
            Hello from React Native!
            {'\n\n'}
            UI Manager: {nativeFabricUIManager ? 'Fabric' : 'Paper'}
            {'\n\n'}
            JS Engine: {HermesInternal ? 'Hermes' : 'JSC'}
            {'\n\n'}
            Expo Version: {Constants.expoConfig?.sdkVersion}
            {'\n\n'}
            Expo Modules: {Object.keys(expo?.modules ?? {}).join(', ')}
            {'\n\n'}
            Nitro: {multiply(3, 4) === 12 ? '✅' : '❌'}
        </Text>
    )
}
