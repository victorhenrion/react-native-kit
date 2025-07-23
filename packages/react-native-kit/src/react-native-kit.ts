import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { program } from 'commander'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

program
    .command('macos')
    .option('--targetDir <path>', 'Path to target directory', './macos')
    .option('--configs <list>', 'List of configurations to build, e.g. "Debug,Release"', 'Debug,Release')
    .option('--clean', 'Clean codegen, Pods and DerivedData', false)
    .option('--legacyArch', 'Opt out of new architecture', false)
    .option('--frameworks <list>', 'Comma-separated list of additional frameworks to add as binary targets', '')
    .action(async (opts) => {
        await execute({
            platform: 'macos',
            sdks: ['macosx'],
            configs: opts.configs.split(','),
            blueprintDir: fileURLToPath(import.meta.resolve(`../macos`)),
            targetDir: parseDirOption(opts.targetDir),
            clean: opts.clean,
            frameworks: ['ReactBrownfield', ...opts.frameworks.split(',').filter(Boolean)],
            env: {
                RCT_NEW_ARCH_ENABLED: opts.legacyArch ? '0' : '1',
                USE_FRAMEWORKS: 'static',
            },
        })
    })

program
    .command('ios')
    .option('--targetDir <path>', 'Path to target directory', './ios')
    .option('--configs <list>', 'List of configurations to build, e.g. "Debug,Release"', 'Debug,Release')
    .option('--clean', 'Clean codegen, Pods and DerivedData', false)
    .option('--legacyArch', 'Opt out of new architecture', false)
    .option('--frameworks <list>', 'Comma-separated list of additional frameworks to add as binary targets', '')
    .action(async (opts) => {
        await execute({
            platform: 'ios',
            sdks: ['iphonesimulator', 'iphoneos'],
            configs: opts.configs.split(','),
            blueprintDir: fileURLToPath(import.meta.resolve(`../ios`)),
            targetDir: parseDirOption(opts.targetDir),
            clean: opts.clean,
            frameworks: ['ReactBrownfield', ...opts.frameworks.split(',').filter(Boolean)],
            env: {
                RCT_NEW_ARCH_ENABLED: opts.legacyArch ? '0' : '1',
                USE_FRAMEWORKS: 'static',
            },
        })
    })

function parseDirOption(dir: string) {
    return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
}

async function readPodfileVersion(path: string) {
    const contents = await fs.readFile(path, 'utf-8').catch(() => '')
    const [, , version] = contents.match(/react-native-kit-version:(\s+)?(\d+)/) ?? []
    return version ? Number(version) : null
}

type Options = {
    platform: 'ios' | 'macos'
    sdks: ('iphonesimulator' | 'iphoneos' | 'macosx')[]
    configs: ('Debug' | 'Release')[]
    blueprintDir: string
    targetDir: string
    clean: boolean
    frameworks: ['ReactBrownfield', ...string[]]
    env: Record<string, string>
}

async function execute(options: Options) {
    const { platform, sdks, configs, blueprintDir, targetDir, clean, frameworks, env } = options

    const exec = (...parts: string[]) =>
        execSync(parts.join(' '), {
            cwd: targetDir,
            stdio: 'inherit',
            env: { ...process.env, ...env },
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
                `EXCLUDED_ARCHS=x86_64`,
            )
        }
        // combine into xcframework
        console.log(`[KIT] Creating ${config} ReactNativeKit.xcframework…`)
        exec(
            `xcodebuild`,
            `-create-xcframework`,
            ...sdks.map((sdk) =>
                `-framework "./kit/temp/${config}/${sdk}/ReactNativeKit.xcarchive/Products/Library/Frameworks/ReactNativeKit.framework"`
            ),
            `-output "./kit/${config}/ReactNativeKit.xcframework"`,
        )
    }

    const createPodsXcframeworks = async (config: 'Debug' | 'Release') => {
        for (const framework of frameworks) {
            console.log(`[KIT] Creating ${config} ${framework}.xcframework…`)
            exec(
                `xcodebuild`,
                `-create-xcframework`,
                ...sdks.map((sdk) =>
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

program.parse(process.argv)
