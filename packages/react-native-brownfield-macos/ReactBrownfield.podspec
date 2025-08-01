require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |spec|
  spec.name         = "ReactBrownfield"
  spec.version      = package['version']
  spec.summary      = package['description']
  spec.license      = package['license']

  spec.authors      = package['author']
  spec.homepage     = package['homepage']
  spec.platform     = :macos, "11.0"

  spec.module_name = "ReactBrownfield"
  spec.source       = { :git => "https://github.com/victorhenrion/react-native-kit.git", :tag => "#{spec.version}" }
  spec.source_files  = "macos/**/*.{h,m,mm,swift}"
  spec.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_SWIFT_FLAGS' => "-enable-experimental-feature AccessLevelOnImport"
  }

  spec.dependency 'ReactAppDependencyProvider'
  add_dependency(spec, "React-RCTAppDelegate")

  install_modules_dependencies(spec)
end
