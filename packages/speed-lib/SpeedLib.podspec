require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "SpeedLib"
  s.version      = package["version"]
  s.platforms    = { :ios => "15.1", :macos => "11.0"}

  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.source       = { :git => "https://github.com/victorhenrion/react-native-kit.git", :tag => "#{s.version}" }

  s.source_files = [
    "Sources/**/*.{swift}",
  ]

  s.dependency "SpeedLibProtocol"

  s.pod_target_xcconfig = {
    "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) FOLLY_NO_CONFIG FOLLY_CFG_NO_COROUTINES",
  }

  load 'nitrogen/generated/ios/SpeedLib+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
