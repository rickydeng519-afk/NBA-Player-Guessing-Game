#!/usr/bin/env python3
"""Generate the Xcode project.pbxproj for NBA Mystery Player iOS app."""
import os, uuid

def hex_id():
    return uuid.uuid4().hex[:24].upper()

# Generate unique IDs
f_app        = hex_id()
f_content    = hex_id()
f_webview    = hex_id()
f_gamehtml   = hex_id()
f_assets     = hex_id()
f_info       = hex_id()
f_product    = hex_id()
f_swiftlib   = hex_id()

bf_app       = hex_id()
bf_content   = hex_id()
bf_webview   = hex_id()
bf_gamehtml  = hex_id()
bf_assets    = hex_id()

g_main       = hex_id()
g_sources    = hex_id()
g_resources  = hex_id()
g_products   = hex_id()
g_root       = hex_id()

t_native     = hex_id()
pbx_sources  = hex_id()
pbx_resources = hex_id()
pbx_frameworks = hex_id()

proj         = hex_id()
cfg_debug    = hex_id()
cfg_release  = hex_id()
proj_debug   = hex_id()
proj_release = hex_id()
cfglist_proj = hex_id()
cfglist_target = hex_id()

nativerf     = hex_id()

build_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.join(build_dir, "NBA-Mystery-Player.xcodeproj")
os.makedirs(project_dir, exist_ok=True)

pbxproj = f'''// !$*UTF8*$!
{{
	archiveVersion = 1;
	classes = {{
	}};
	objectVersion = 56;
	objects = {{

/* Begin PBXBuildFile section */
		{bf_app} /* App.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {f_app}; }};
		{bf_content} /* ContentView.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {f_content}; }};
		{bf_webview} /* WebView.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {f_webview}; }};
		{bf_gamehtml} /* game.html in Resources */ = {{isa = PBXBuildFile; fileRef = {f_gamehtml}; }};
		{bf_assets} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {f_assets}; }};
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
		{f_app} /* App.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = App.swift; sourceTree = "<group>"; }};
		{f_content} /* ContentView.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ContentView.swift; sourceTree = "<group>"; }};
		{f_webview} /* WebView.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = WebView.swift; sourceTree = "<group>"; }};
		{f_gamehtml} /* game.html */ = {{isa = PBXFileReference; lastKnownFileType = text.html; path = game.html; sourceTree = "<group>"; }};
		{f_assets} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; }};
		{f_info} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; }};
		{f_product} /* NBA Mystery Player.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = "NBA Mystery Player.app"; sourceTree = BUILT_PRODUCTS_DIR; }};
/* End PBXFileReference section */

/* Begin PBXGroup section */
		{g_root} = {{
			isa = PBXGroup;
			children = (
				{g_sources} /* Sources */,
				{g_resources} /* Resources */,
				{g_products} /* Products */,
			);
			sourceTree = "<group>";
		}};
		{g_sources} /* Sources */ = {{
			isa = PBXGroup;
			children = (
				{f_app} /* App.swift */,
				{f_content} /* ContentView.swift */,
				{f_webview} /* WebView.swift */,
			);
			path = "NBA-Mystery-Player";
			sourceTree = "<group>";
		}};
		{g_resources} /* Resources */ = {{
			isa = PBXGroup;
			children = (
				{f_gamehtml} /* game.html */,
				{f_assets} /* Assets.xcassets */,
				{f_info} /* Info.plist */,
			);
			path = "NBA-Mystery-Player";
			sourceTree = "<group>";
		}};
		{g_products} /* Products */ = {{
			isa = PBXGroup;
			children = (
				{f_product} /* NBA Mystery Player.app */,
			);
			name = Products;
			sourceTree = "<group>";
		}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		{t_native} /* NBA Mystery Player */ = {{
			isa = PBXNativeTarget;
			buildConfigurationList = {cfglist_target} /* Build configuration list for PBXNativeTarget */;
			buildPhases = (
				{pbx_sources} /* Sources */,
				{pbx_frameworks} /* Frameworks */,
				{pbx_resources} /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = "NBA Mystery Player";
			productName = "NBA Mystery Player";
			productReference = {f_product} /* NBA Mystery Player.app */;
			productType = "com.apple.product-type.application";
		}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		{proj} /* Project object */ = {{
			isa = PBXProject;
			attributes = {{
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1620;
				LastUpgradeCheck = 1620;
				TargetAttributes = {{
					{t_native} = {{
						CreatedOnToolsVersion = 16.2;
					}};
				}};
			}};
			buildConfigurationList = {cfglist_proj} /* Build configuration list for PBXProject */;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = {g_root};
			productRefGroup = {g_products} /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				{t_native} /* NBA Mystery Player */,
			);
		}};
/* End PBXProject section */

/* Begin PBXSourcesBuildPhase section */
		{pbx_sources} /* Sources */ = {{
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				{bf_app} /* App.swift in Sources */,
				{bf_content} /* ContentView.swift in Sources */,
				{bf_webview} /* WebView.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXSourcesBuildPhase section */

/* Begin PBXResourcesBuildPhase section */
		{pbx_resources} /* Resources */ = {{
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				{bf_gamehtml} /* game.html in Resources */,
				{bf_assets} /* Assets.xcassets in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXFrameworksBuildPhase section */
		{pbx_frameworks} /* Frameworks */ = {{
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXFrameworksBuildPhase section */

/* Begin XCBuildConfiguration section */
		{cfg_debug} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CODE_SIGN_IDENTITY = "";
				CODE_SIGN_STYLE = Automatic;
				CODE_SIGNING_ALLOWED = NO;
				CURRENT_PROJECT_VERSION = 1;
				ENABLE_PREVIEWS = YES;
				INFOPLIST_FILE = "NBA-Mystery-Player/Info.plist";
				IPHONEOS_DEPLOYMENT_TARGET = 18.0;
				SDKROOT = iphoneos;
				SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.nba.mysteryplayer;
				PRODUCT_NAME = "NBA Mystery Player";
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			}};
			name = Debug;
		}};
		{cfg_release} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CODE_SIGN_IDENTITY = "";
				CODE_SIGN_STYLE = Automatic;
				CODE_SIGNING_ALLOWED = NO;
				CURRENT_PROJECT_VERSION = 1;
				ENABLE_PREVIEWS = YES;
				INFOPLIST_FILE = "NBA-Mystery-Player/Info.plist";
				IPHONEOS_DEPLOYMENT_TARGET = 18.0;
				SDKROOT = iphoneos;
				SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.nba.mysteryplayer;
				PRODUCT_NAME = "NBA Mystery Player";
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			}};
			name = Release;
		}};
		{proj_debug} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"$(inherited)",
				);
				IPHONEOS_DEPLOYMENT_TARGET = 18.0;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			}};
			name = Debug;
		}};
		{proj_release} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				GCC_OPTIMIZATION_LEVEL = s;
				IPHONEOS_DEPLOYMENT_TARGET = 18.0;
				MTL_ENABLE_DEBUG_INFO = NO;
				SDKROOT = iphoneos;
				SWIFT_COMPILATION_MODE = wholemodule;
				SWIFT_OPTIMIZATION_LEVEL = "-O";
				VALIDATE_PRODUCT = YES;
			}};
			name = Release;
		}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		{cfglist_proj} /* Build configuration list for PBXProject "NBA Mystery Player" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{proj_debug} /* Debug */,
				{proj_release} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
		{cfglist_target} /* Build configuration list for PBXNativeTarget "NBA Mystery Player" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{cfg_debug} /* Debug */,
				{cfg_release} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
/* End XCConfigurationList section */
	}};
	rootObject = {proj} /* Project object */;
}}
'''

with open(os.path.join(project_dir, "project.pbxproj"), "w") as f:
    f.write(pbxproj)

# Also generate the xcscheme
scheme_dir = os.path.join(project_dir, "xcshareddata", "xcschemes")
os.makedirs(scheme_dir, exist_ok=True)
scheme_name = "NBA Mystery Player"
xcscheme = f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1620"
   version = "1.3">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "{t_native}"
               BuildableName = "NBA Mystery Player.app"
               BlueprintName = "NBA Mystery Player"
               ReferencedContainer = "container:NBA-Mystery-Player.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES">
      <Testables>
      </Testables>
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{t_native}"
            BuildableName = "NBA Mystery Player.app"
            BlueprintName = "NBA Mystery Player"
            ReferencedContainer = "container:NBA-Mystery-Player.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{t_native}"
            BuildableName = "NBA Mystery Player.app"
            BlueprintName = "NBA Mystery Player"
            ReferencedContainer = "container:NBA-Mystery-Player.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
'''

with open(os.path.join(scheme_dir, f"{scheme_name}.xcscheme"), "w") as f:
    f.write(xcscheme)

print(f"Generated project.pbxproj at {project_dir}")
print(f"Generated xcscheme at {scheme_dir}")
print(f"Target UUID: {t_native}")
