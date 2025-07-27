import type { HybridObject } from 'react-native-nitro-modules'

export interface SpeedLib extends HybridObject<{ ios: 'swift' }> {
    multiply(a: number, b: number): number
}
