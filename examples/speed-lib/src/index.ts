import { NitroModules } from 'react-native-nitro-modules'
import type { SpeedLib } from './SpeedLib.nitro'

const SpeedLibHybridObject = NitroModules.createHybridObject<SpeedLib>('SpeedLib')

export function multiply(a: number, b: number): number {
    return SpeedLibHybridObject.multiply(a, b)
}
