import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { defineCommand, runMain } from 'citty'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as v from 'valibot'

runMain(defineCommand({
    meta: {
        name: 'react-native-kit',
    },
    args: {
        platform: {
            description: 'Platform to build, either "ios" or "macos"',
            required: true,
            type: 'positional',
        },
        sdks: {
            description: '[iOS only] Comma-separated list among "iphoneos", "iphonesimulator"',
            default: 'iphoneos,iphonesimulator',
            type: 'string',
        },
        targetDir: {
            description: 'Path to target directory',
            default: './<platform>',
            type: 'string',
        },
        configs: {
            description: 'List of configurations to build',
            default: 'Debug,Release',
            type: 'string',
        },
        archs: {
            description: '"STANDARD", "ONLY_ACTIVE", or a list of architectures',
            default: 'STANDARD',
            type: 'string',
        },
        clean: {
            description: 'Clean codegen, Pods and DerivedData',
            default: false,
            type: 'boolean',
        },
        reactLegacyArch: {
            description: 'Opt out of React Native\'s New Architecture',
            default: false,
            type: 'boolean',
        },
        frameworks: {
            description: 'Comma-separated list of additional frameworks to add as binary targets',
            default: '',
            type: 'string',
        },
    },
    run: ({ args }) =>
        execute(v.parse(
            optionsSchema,
            {
                ...({
                    ios: {
                        platform: 'ios',
                        sdks: parseCsl(args.sdks) as Set<'iphoneos' | 'iphonesimulator'>,
                    },
                    macos: {
                        platform: 'macos',
                        sdks: parseCsl('macosx') as Set<'macosx'>,
                    },
                } as const)[v.parse(v.picklist(['ios', 'macos']), args.platform)],

                targetDir: parsePath(args.targetDir).replace('<platform>', args.platform),

                configs: parseCsl(args.configs) as Set<'Debug' | 'Release'>,

                archs: args.archs === 'STANDARD' || args.archs === 'ONLY_ACTIVE'
                    ? { preset: args.archs }
                    : { preset: 'CUSTOM', list: parseCsl(args.archs) },

                clean: args.clean,

                reactLegacyArch: args.reactLegacyArch,

                frameworks: parseCsl(args.frameworks),
            } satisfies v.InferInput<typeof optionsSchema>,
        )),
}))

const baseOptionsSchema = v.object({
    targetDir: v.string(),
    configs: v.pipe(v.set(v.picklist(['Debug', 'Release'])), v.minSize(1)),
    archs: v.variant('preset', [
        v.object({ preset: v.literal('STANDARD') }),
        v.object({ preset: v.literal('ONLY_ACTIVE') }),
        v.object({ preset: v.literal('CUSTOM'), list: v.pipe(v.set(v.string()), v.minSize(1)) }),
    ]),
    clean: v.boolean(),
    reactLegacyArch: v.boolean(),
    frameworks: v.set(v.string()),
})

const optionsSchema = v.variant('platform', [
    v.object({ // ios
        ...baseOptionsSchema.entries,
        platform: v.literal('ios'),
        sdks: v.set(v.picklist(['iphoneos', 'iphonesimulator'])),
    }),
    v.object({ // macos
        ...baseOptionsSchema.entries,
        platform: v.literal('macos'),
        sdks: v.set(v.picklist(['macosx'])),
    }),
])

async function execute(options: v.InferOutput<typeof optionsSchema>) {
    const { targetDir, configs, archs, clean, reactLegacyArch, frameworks, platform, sdks } = options

    const blueprintDir = fileURLToPath(import.meta.resolve(`../${platform}`))

    const exec = (...parts: string[]) =>
        execSync(parts.join(' '), {
            cwd: targetDir,
            stdio: 'inherit',
            env: {
                ...process.env,
                RCT_NEW_ARCH_ENABLED: reactLegacyArch ? '0' : '1',
                USE_FRAMEWORKS: 'static',
            },
        })

    const copyTarget = async () => {
        if (existsSync(targetDir)) return
        await fs.mkdir(targetDir, { recursive: true })
        await fs.cp(blueprintDir, targetDir, { recursive: true })
    }

    const checkTargetVersion = async () => {
        const [targetVersion, blueprintVersion] = await Promise.all([
            readPodfileVersion(path.join(targetDir, 'Podfile')),
            readPodfileVersion(path.join(blueprintDir, 'Podfile')),
        ])
        if (!blueprintVersion) {
            console.log(`[KIT] Unrecognized blueprint version, this is likely a bug.`)
        } else if (!targetVersion || targetVersion < blueprintVersion) {
            console.log(`[KIT] Your target dir (${blueprintDir.split('/').pop()}) is outdated. Consider deleting it.`)
        }
    }

    const cleanTarget = async () => {
        if (!clean) return
        await fs.rm(path.join(targetDir, 'build'), { recursive: true, force: true }) // codegen
        await fs.rm(path.join(targetDir, 'kit'), { recursive: true, force: true }) // clearOutputs + DerivedData
        await fs.rm(path.join(targetDir, 'Pods'), { recursive: true, force: true }) // pods
    }

    const installPods = async () => {
        exec('bundle', 'install')
        exec('bundle', 'exec', 'pod', 'install')
    }

    const patchExpoScripts = async () => {
        const scripts = fs.glob('**/expo-configure-project.sh', {
            cwd: path.join(targetDir, 'Pods', 'Target Support Files'),
            withFileTypes: true,
        })

        for await (const { parentPath, name } of scripts) {
            const scriptPath = path.join(parentPath, name)
            const providerPath = path.join(parentPath, 'ExpoModulesProvider.swift')

            const originalScript = await fs.readFile(scriptPath, 'utf-8')
            if (originalScript.includes('internal class ExpoModulesProvider')) continue // already patched
            const patchedScript = originalScript.concat(
                `\n`,
                `sed -E -i.bak`,
                ` -e 's/^[[:space:]]*import[[:space:]]+(Expo([[:alnum:]_]+)?|EX[[:alnum:]_]+)/@_implementationOnly import \\1/g'`,
                ` -e 's/public[[:space:]]+class[[:space:]]+ExpoModulesProvider/internal class ExpoModulesProvider/g'`,
                ` "${providerPath}"`,
            )
            await fs.writeFile(scriptPath, patchedScript)
        }
    }

    const clearOutputs = async (config: 'Debug' | 'Release') => {
        // clear archives (which contains ReactNativeKit.framework)
        for (const sdk of sdks) {
            const archivePath = path.join(targetDir, 'kit', 'temp', config, sdk, 'ReactNativeKit.xcarchive')
            await fs.rm(archivePath, { recursive: true, force: true })
        }
        // clear xcframeworks we created/copied
        const outputDir = path.join(targetDir, 'kit', config)
        await fs.rm(outputDir, { recursive: true, force: true })
        // keeps DerivedData
    }

    const createKitXcframework = async (config: 'Debug' | 'Release') => {
        // create frameworks
        for (const sdk of sdks) {
            console.log(`[KIT] Building ${config} ReactNativeKit ${sdk} framework…`)

            const extras = []

            if (archs.preset === 'ONLY_ACTIVE') {
                extras.push(`ONLY_ACTIVE_ARCH=YES`)
            } else if (archs.preset === 'CUSTOM') {
                extras.push(`ARCHS=${archs.list}`)
            }

            exec(
                `xcodebuild`,
                `archive`,
                `-workspace ReactNativeKit.xcworkspace`,
                `-scheme ReactNativeKit`,
                `-destination "generic/platform=${sdk}"`,
                `-configuration ${config}`,
                `-sdk ${sdk}`,
                `-archivePath "./kit/temp/${config}/${sdk}/ReactNativeKit.xcarchive"`,
                `-derivedDataPath "./kit/temp/${config}/${sdk}/DerivedData"`,
                ...extras,
            )
        }
        // combine into xcframework
        console.log(`[KIT] Creating ${config} ReactNativeKit.xcframework…`)
        exec(
            `xcodebuild`,
            `-create-xcframework`,
            ...Array.from(sdks).map((sdk) =>
                `-framework "./kit/temp/${config}/${sdk}/ReactNativeKit.xcarchive/Products/Library/Frameworks/ReactNativeKit.framework"`
            ),
            `-output "./kit/${config}/ReactNativeKit.xcframework"`,
        )
    }

    const createPodsXcframeworks = async (config: 'Debug' | 'Release') => {
        for (const framework of ['ReactBrownfield', ...frameworks]) {
            console.log(`[KIT] Creating ${config} ${framework}.xcframework…`)
            exec(
                `xcodebuild`,
                `-create-xcframework`,
                ...Array.from(sdks).map((sdk) =>
                    `-framework "./kit/temp/${config}/${sdk}/DerivedData/Build/Intermediates.noindex/ArchiveIntermediates/ReactNativeKit/IntermediateBuildFilesPath/UninstalledProducts/${sdk}/${framework}.framework"`
                ),
                `-output "./kit/${config}/${framework}.xcframework"`,
            )
        }
    }

    const copyPodsXcframeworks = async (config: 'Debug' | 'Release') => {
        // copy xcframeworks
        const xcframeworks = fs.glob('**/*.xcframework', {
            cwd: path.join(targetDir, 'Pods'),
            withFileTypes: true,
        })

        for await (const { parentPath, name } of xcframeworks) {
            if (platform === 'macos' && name === 'hermes.xcframework') continue // does not contain macosx variant
            const source = path.join(parentPath, name)
            const destination = path.join(targetDir, 'kit', config, name)
            console.log(`[KIT] Copying ${config} ${name}…`)
            await fs.cp(source, destination, { recursive: true })
        }

        // macos: create hermes xcframework as it does not exist, directly in output
        if (platform === 'macos') {
            console.log(`[KIT] Creating ${config} hermes.xcframework…`)
            exec(
                `xcodebuild`,
                `-create-xcframework`,
                `-framework "./Pods/hermes-engine/destroot/Library/Frameworks/macosx/hermes.framework"`,
                `-output "./kit/${config}/hermes.xcframework"`,
            )
        }
    }

    console.log(`[KIT] Computed options:`, `\n`, JSON.stringify(options, null, 2))
    console.log(`[KIT] Initializing…`)
    await copyTarget()
    await checkTargetVersion()
    await cleanTarget()
    console.log(`[KIT] Installing pods…`)
    await installPods()
    console.log(`[KIT] Patching Expo scripts…`)
    await patchExpoScripts()
    console.log(`[KIT] Preparing to build…`)
    for (const config of configs) {
        await clearOutputs(config)
        await createKitXcframework(config)
        await createPodsXcframeworks(config)
        await copyPodsXcframeworks(config)
    }
}

function parseCsl(input: string) {
    return new Set(input.split(',').filter(Boolean))
}

function parsePath(input: string) {
    return path.isAbsolute(input) ? input : path.join(process.cwd(), input)
}

async function readPodfileVersion(path: string) {
    const contents = await fs.readFile(path, 'utf-8').catch(() => '')
    const [, , version] = contents.match(/react-native-kit-version:(\s+)?(\d+)/) ?? []
    return version ? Number(version) : null
}
