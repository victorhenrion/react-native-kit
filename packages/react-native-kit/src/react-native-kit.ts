import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { program } from 'commander'
import child from 'node:child_process'
import url from 'node:url'

program
    .command('macos')
    .option('--targetDir <path>', 'Path to target directory', './macos')
    .action(async (opts) => {
        const targetDir = path.isAbsolute(opts.targetDir) ? opts.targetDir : path.join(process.cwd(), opts.targetDir)

        await execute({
            platform: 'macos',
            targetDir,
            configs: ['Debug', 'Release'],
            sdks: ['macosx'],
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
        })
    })

type Options = {
    platform: 'ios' | 'macos'
    targetDir: string
    configs: ('Debug' | 'Release')[]
    sdks: ('iphonesimulator' | 'iphoneos' | 'macosx')[]
}

async function execute({ platform, targetDir, configs, sdks }: Options) {
    const sourceDir = url.fileURLToPath(import.meta.resolve(`../${platform}`))

    await fs.rm(targetDir, { recursive: true }).catch(() => {})
    await fs.mkdir(targetDir, { recursive: true })

    // copy the platform directory from the react-native-kit package
    await fs.cp(sourceDir, targetDir, { recursive: true })

    // install pods
    child.execSync(
        ['bundle', 'install'].join(' '),
        { cwd: targetDir, stdio: 'inherit' },
    )
    child.execSync(
        ['bundle', 'exec', 'pod', 'install'].join(' '),
        { cwd: targetDir, stdio: 'inherit' },
    )

    for (const config of configs) {
        // build frameworks for each sdk
        for (const sdk of sdks) {
            child.execSync(
                [
                    `xcodebuild`,
                    `-workspace ReactNativeKit.xcworkspace`,
                    `-scheme ReactNativeKit`,
                    `-destination "generic/platform=${sdk}"`,
                    `-configuration ${config}`,
                    `-sdk ${sdk}`,
                    `-archivePath "./temp/${config}/${sdk}/ReactNativeKit.xcarchive"`,
                    `archive`,
                ].join(` `),
                { cwd: targetDir, stdio: 'inherit' },
            )
        }

        // on macos, hermes must be built as an xcframework
        if (platform === 'macos') {
            child.execSync(
                [
                    `xcodebuild`,
                    `-create-xcframework`,
                    `-framework "./Pods/hermes-engine/destroot/Library/Frameworks/macosx/hermes.framework"`,
                    `-output "./Pods/hermes-engine/destroot/Library/Frameworks/macosx/hermes.xcframework"`,
                ].join(' '),
                { cwd: targetDir, stdio: 'inherit' },
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
        child.execSync(
            [
                `xcodebuild`,
                `-create-xcframework`,
                ...sdks.map((sdk) =>
                    `-framework "./temp/${config}/${sdk}/ReactNativeKit.xcarchive/Products/Library/Frameworks/ReactNativeKit.framework"`
                ),
                `-output "./output/${config}/ReactNativeKit.xcframework"`,
            ].join(' '),
            { cwd: targetDir, stdio: 'inherit' },
        )
    }
}

program.parse(process.argv)
