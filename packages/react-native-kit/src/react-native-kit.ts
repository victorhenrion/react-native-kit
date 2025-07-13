import fs from 'node:fs/promises'
import path from 'node:path'
import { program } from 'commander'
import cp from 'node:child_process'
import url from 'node:url'

program
    .command('macos')
    .option('--targetDir <path>', 'Path to target directory', './macos')
    .option('--legacyArch', 'Opt out of new architecture', false)
    .action(async (opts) => {
        const targetDir = path.isAbsolute(opts.targetDir) ? opts.targetDir : path.join(process.cwd(), opts.targetDir)

        await execute({
            platform: 'macos',
            targetDir,
            configs: ['Debug', 'Release'],
            sdks: ['macosx'],
            env: {
                ...process.env,
                RCT_NEW_ARCH_ENABLED: opts.legacyArch ? '0' : '1',
            },
        })
    })

program
    .command('ios')
    .option('--targetDir <path>', 'Path to target directory', './ios')
    .action(async (opts) => {
        const targetDir = path.isAbsolute(opts.targetDir) ? opts.targetDir : path.join(process.cwd(), opts.targetDir)

        await execute({
            platform: 'ios',
            targetDir,
            configs: ['Debug', 'Release'],
            sdks: ['iphonesimulator', 'iphoneos'],
            env: {
                ...process.env,
            },
        })
    })

type Options = {
    platform: 'ios' | 'macos'
    targetDir: string
    configs: ('Debug' | 'Release')[]
    sdks: ('iphonesimulator' | 'iphoneos' | 'macosx')[]
    env: NodeJS.ProcessEnv
}

async function execute({ platform, targetDir, configs, sdks, env }: Options) {
    const sourceDir = url.fileURLToPath(import.meta.resolve(`../${platform}`))

    await fs.rm(targetDir, { recursive: true }).catch(() => {})
    await fs.mkdir(targetDir, { recursive: true })

    // copy the platform directory from the react-native-kit package
    await fs.cp(sourceDir, targetDir, { recursive: true })

    const exec = (...parts: string[]) => cp.execSync(parts.join(' '), { cwd: targetDir, stdio: 'inherit', env })

    // install pods
    exec('bundle', 'install')
    exec('bundle', 'exec', 'pod', 'install')

    // patch expo-configure-project.sh
    const tsf = path.join(targetDir, 'Pods', 'Target Support Files')
    const scripts = await Array.fromAsync(fs.glob('**/expo-configure-project.sh', { cwd: tsf, withFileTypes: false }))

    for (const scriptRelPath of scripts) {
        const scriptPath = path.join(tsf, scriptRelPath)
        const providerPath = path.join(scriptPath, '../ExpoModulesProvider.swift')
        const scriptContents = await fs.readFile(scriptPath, 'utf-8')
        const patchedContents = scriptContents.concat(
            `\n`,
            `sed -E -i.bak`,
            ` -e 's/^[[:space:]]*import[[:space:]]+(Expo([[:alnum:]_]+)?|EX[[:alnum:]_]+)/@_implementationOnly import \\1/g'`,
            ` -e 's/public[[:space:]]+class[[:space:]]+ExpoModulesProvider/internal class ExpoModulesProvider/g'`,
            ` "${providerPath}"`,
        )
        await fs.writeFile(scriptPath, patchedContents)
    }

    for (const config of configs) {
        // build frameworks for each sdk
        for (const sdk of sdks) {
            exec(
                `xcodebuild`,
                `-workspace ReactNativeKit.xcworkspace`,
                `-scheme ReactNativeKit`,
                `-destination "generic/platform=${sdk}"`,
                `-configuration ${config}`,
                `-sdk ${sdk}`,
                `-archivePath "./temp/${config}/${sdk}/ReactNativeKit.xcarchive"`,
                `archive`,
                `EXCLUDED_ARCHS=x86_64`,
            )
        }

        // on macos, hermes must be built as an xcframework
        if (platform === 'macos') {
            exec(
                `xcodebuild`,
                `-create-xcframework`,
                `-framework "./Pods/hermes-engine/destroot/Library/Frameworks/macosx/hermes.framework"`,
                `-output "./Pods/hermes-engine/destroot/Library/Frameworks/macosx/hermes.xcframework"`,
            )
        }

        // copy Pods xcframeworks to output (this happens after running xcodebuild because it modifies the Pods directory, e.g. hermes is config-specific)
        const xcframeworks = await Array.fromAsync(
            fs.glob('**/*.xcframework', {
                cwd: path.join(targetDir, 'Pods'),
                withFileTypes: false,
            }),
        )
        for await (const xcframework of xcframeworks) {
            const source = path.join(targetDir, 'Pods', xcframework)
            const destination = path.join(targetDir, 'output', config, path.basename(source))
            await fs.cp(source, destination, { recursive: true })
        }

        // combine our frameworks into a single xcframework in output
        exec(
            `xcodebuild`,
            `-create-xcframework`,
            ...sdks.map((sdk) =>
                `-framework "./temp/${config}/${sdk}/ReactNativeKit.xcarchive/Products/Library/Frameworks/ReactNativeKit.framework"`
            ),
            `-output "./output/${config}/ReactNativeKit.xcframework"`,
        )
    }
}

program.parse(process.argv)
