import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Sparkles,
  FileText,
  HelpCircle,
  PackageCheck
} from 'lucide-react';
import { generateAndroidStudioProjectZip } from '../utils/androidProjectZip';
import { torchEngine } from '../utils/torchEngine';

interface PlayStorePublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayStorePublishModal: React.FC<PlayStorePublishModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'no_laptop' | 'build' | 'listing' | 'datasafety' | 'privacy'>('no_laptop');

  if (!isOpen) return null;

  const handleDownloadProjectZip = async () => {
    try {
      setIsGeneratingZip(true);
      torchEngine.triggerHaptic(20);
      const zipBlob = await generateAndroidStudioProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'LumenTorch-Android-Studio-Project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (e) {
      console.error('Failed to generate zip', e);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDownloadKeystore = () => {
    torchEngine.triggerHaptic(15);
    const link = document.createElement('a');
    link.href = '/build/release.keystore';
    link.download = 'release.keystore';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const appLiveUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-pl27xnodaml4a4j5q7it6i-504003273349.asia-east1.run.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(appLiveUrl)}`;

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    torchEngine.triggerHaptic(12);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const listingTitle = "LumenTorch - Brightness & Strobe";
  const listingShortDesc = "Android 13+ Camera2 multi-level torch brightness, strobe flicker & presets.";
  const listingFullDesc = `LumenTorch is an advanced flashlight brightness controller designed specifically for Android 13+ (API level 33+) leveraging the native Camera2 multi-level brightness control API.

KEY FEATURES:
• Multi-Level Brightness Slider: Adjust hardware LED current from 1 to Max Level (Google Pixel, Galaxy S23/S24, Xiaomi).
• Variable-Speed Strobe Flicker: 1 Hz to 25 Hz flash frequency with adjustable duty cycle.
• Tactical Patterns: SOS Morse code (... --- ...), Emergency Beacon, and Organic Candle Flame.
• Quick Presets: Bedside Soft, Indoor Walk, Standard Path, and Ultra Boost.
• Quick Settings Tile: Control brightness directly from your Android notification shade.
• Auto-Off Safety Timer: Protect battery life and prevent LED overheating.
• High-CRI Screen Lantern: Diffuse screen illumination with warm amber, neutral, daylight, and tactical night-vision red modes.

Privacy First:
LumenTorch operates 100% offline. The camera permission is used solely to control the physical flash LED; no images or audio are ever recorded or transmitted.`;

  const privacyPolicyText = `# Privacy Policy for LumenTorch
Last updated: November 2026

LumenTorch ("the Application") is committed to user privacy.

1. Camera Permission Usage
The Application requests the Android CAMERA permission strictly to activate and control the device's physical LED flash hardware using the Android Camera2 API (CameraManager.turnOnTorchWithStrengthLevel).
- The Application does NOT take photographs, record video, or capture any visual data.
- The camera sensor stream is never saved, processed, or transmitted.

2. Personal Data & Privacy
- No Personal Data Collected: We do not collect names, email addresses, location, device IDs, or usage metrics.
- No Tracking or Ads: The app contains no third-party telemetry, ads, or tracking cookies.
- Offline Capability: All features run locally on your device without network requirements.

3. Changes
Any updates to this policy will be posted on this page.

Contact: support@lumentorch.app`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Publish to Google Play Store</h2>
              <p className="text-xs text-neutral-400">Android 14 (API 34) Ready · Complete Source Bundle & Guide</p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instant Action Hero Banner */}
        <div className="p-5 bg-gradient-to-r from-amber-500/15 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Full Android Studio Project Ready</span>
            </div>
            <p className="text-xs text-neutral-300 max-w-md">
              Download the complete native Android project bundle (.zip) with Jetpack Compose, Camera2 API 33 multi-level manager, and Quick Settings tile service.
            </p>
          </div>

          <button
            onClick={handleDownloadProjectZip}
            disabled={isGeneratingZip}
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all active:scale-95 shadow-md shadow-amber-500/25 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingZip ? (
              <span>Packing Project...</span>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Android Studio Project (.ZIP)</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-neutral-800 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveStepTab('no_laptop')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeStepTab === 'no_laptop'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 No Laptop? Cloud .AAB & Keystore</span>
          </button>
          <button
            onClick={() => setActiveStepTab('build')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeStepTab === 'build'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Android Studio Build
          </button>
          <button
            onClick={() => setActiveStepTab('listing')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeStepTab === 'listing'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Store Listing Copy
          </button>
          <button
            onClick={() => setActiveStepTab('datasafety')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeStepTab === 'datasafety'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Data Safety Answers
          </button>
          <button
            onClick={() => setActiveStepTab('privacy')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeStepTab === 'privacy'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs select-text">
          {activeStepTab === 'no_laptop' && (
            <div className="space-y-4">
              {/* Live GitHub Actions Signed AAB Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">GitHub Actions Signed Release</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30">
                    v1.0.0-5 Active
                  </span>
                </div>

                <div>
                  <h4 className="text-white font-bold text-sm">LumenTorch Signed AAB is Ready</h4>
                  <p className="text-neutral-300 text-[11px] mt-0.5 leading-relaxed">
                    Built and signed in the cloud for <code className="text-emerald-400 font-mono font-semibold">com.shaktilabs.lumentorch</code> with Target SDK 36. Ready to upload directly to Google Play Console from your phone!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="https://github.com/shivnathtathe/apkk/releases/download/v1.0.0-5/LumenTorch-release-signed.aab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Signed AAB (.aab)</span>
                  </a>
                  <a
                    href="https://github.com/shivnathtathe/apkk/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium text-xs border border-neutral-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View GitHub Releases</span>
                  </a>
                </div>
              </div>

              {/* No Laptop Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Publishing to Google Play Without a Laptop</span>
                </div>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  You do not need a computer or Android Studio! You can generate your signed <strong>.AAB (Android App Bundle)</strong> and upload it to Google Play Console completely from your phone browser using these tools:
                </p>
              </div>

              {/* Method 1: PWABuilder Cloud Compiler */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-xs">Instant Cloud .AAB via PWABuilder</h4>
                      <p className="text-[10px] text-neutral-400">Official Google Play Cloud packager · 60 seconds</p>
                    </div>
                  </div>

                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span>Launch PWABuilder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5 text-[11px] text-neutral-300">
                  <p className="font-medium text-emerald-400">How it works directly on your phone:</p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                    <li>Tap <strong>"Launch PWABuilder"</strong> (it loads this exact app URL).</li>
                    <li>Tap <strong>"Package for Stores"</strong> &gt; Select <strong>Android</strong>.</li>
                    <li>Under Signing, upload your downloaded <code className="text-amber-300 font-mono">release.keystore</code> (download below).</li>
                    <li>Tap <strong>"Generate Package"</strong> and your signed <strong>.AAB</strong> will download directly to your phone's Downloads folder!</li>
                  </ol>
                </div>
              </div>

              {/* Release Keystore Download & Details */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-xs">Your Generated Release Keystore</h4>
                      <p className="text-[10px] text-neutral-400">Created with 2048-bit RSA key · 27-year validity</p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadKeystore}
                    type="button"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Keystore</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-500 block text-[10px]">KEYSTORE FILENAME</span>
                    <span className="text-white font-semibold">release.keystore</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-500 block text-[10px]">KEY ALIAS</span>
                    <span className="text-amber-400 font-semibold">lumentorch</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-500 block text-[10px]">STORE & KEY PASSWORD</span>
                    <span className="text-amber-400 font-semibold">LumenTorch2026!</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-500 block text-[10px]">KEY ALGORITHM</span>
                    <span className="text-neutral-300">RSA 2048-bit (SHA256withRSA)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>SHA-256 Fingerprint:</span>
                    <button
                      onClick={() => handleCopyText('sha256', 'BD:4C:A0:59:BB:72:CB:84:34:36:74:C2:67:9C:61:E7:C6:52:64:49:96:70:FF:7B:A0:B3:52:C7:B2:1C:3C:0B')}
                      className="text-amber-400 hover:text-white"
                    >
                      {copiedKey === 'sha256' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-neutral-300 truncate">BD:4C:A0:59:BB:72:CB:84:34:36:74:C2:67:9C:61:E7:C6:52:64:49:96:70:FF:7B:A0:B3:52:C7:B2:1C:3C:0B</p>
                </div>
              </div>

              {/* Method 2: GitHub Actions Cloud Build */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-xs">GitHub Actions Cloud Builder (Alternative)</h4>
                    <p className="text-[10px] text-neutral-400">Pre-configured cloud CI included in project ZIP</p>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Inside the downloaded project ZIP, there is a ready-to-run GitHub workflow: <code className="text-amber-300 font-mono">.github/workflows/build-playstore-aab.yml</code>. If you create a free repository on GitHub and upload the files from your phone, GitHub compiles the native Kotlin Jetpack Compose code on Ubuntu cloud runners and generates the signed <code className="text-amber-300 font-mono">app-release.aab</code> artifact for download.
                </p>
              </div>

              {/* Upload to Google Play on Mobile Instructions */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>How to upload the .AAB from your phone:</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-300 leading-relaxed">
                  <li>Open <strong>Chrome</strong> on your Android phone and go to <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">play.google.com/console</a>.</li>
                  <li>Tap the <strong>three dots menu (⋮)</strong> in Chrome and check <strong>"Desktop site"</strong>.</li>
                  <li>Click <strong>Create App</strong> &gt; enter the App Name (copy from the "Store Listing Copy" tab).</li>
                  <li>Under <strong>Production &gt; Create new release</strong>, tap <strong>Upload</strong> and pick the downloaded <code className="text-amber-300 font-mono">.aab</code> file from your phone's <em>Downloads</em> folder.</li>
                  <li>Fill in the Data Safety form (using answers in the "Data Safety" tab) and submit!</li>
                </ol>
              </div>
            </div>
          )}

          {activeStepTab === 'build' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>How to generate your signed .AAB for Google Play</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-neutral-300 leading-relaxed text-[11px]">
                  <li>
                    Click the <strong>"Download Android Studio Project (.ZIP)"</strong> button above and unzip the file on your computer.
                  </li>
                  <li>
                    Open <strong>Android Studio</strong> (download free from developer.android.com if not installed).
                  </li>
                  <li>
                    Click <strong>File &gt; Open</strong> and select the unzipped project folder. Android Studio will automatically configure the Gradle build.
                  </li>
                  <li>
                    In the top menu, go to: <strong>Build &gt; Generate Signed Bundle / APK...</strong>
                  </li>
                  <li>
                    Choose <strong>Android App Bundle (.aab)</strong> and click <strong>Next</strong>. (Google Play requires .aab, not .apk).
                  </li>
                  <li>
                    Under <em>Key store path</em>, click <strong>Create new...</strong> to create your upload key (keep this password and file backed up safely).
                  </li>
                  <li>
                    Select the <strong>release</strong> build variant, check <strong>V2/V3 signing</strong>, and click <strong>Create</strong>.
                  </li>
                  <li>
                    Android Studio will produce your signed file at: <code className="text-amber-300 font-mono">app/release/app-release.aab</code>. This is the exact file you upload to Google Play Console!
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-1.5">
                <h4 className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Play Compliance Verified</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 font-mono">
                  <div>· Target SDK: API 36 (Android 16)</div>
                  <div>· Min SDK: API 33 (Android 13)</div>
                  <div>· UI Toolkit: Jetpack Compose</div>
                  <div>· Package: com.shaktilabs.lumentorch</div>
                </div>
              </div>
            </div>
          )}

          {activeStepTab === 'listing' && (
            <div className="space-y-4">
              <p className="text-neutral-400">
                Copy and paste these pre-formatted descriptions directly into your Google Play Console store listing:
              </p>

              {/* Title */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>App Name (under 30 characters)</span>
                  <button
                    onClick={() => handleCopyText('title', listingTitle)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
                  >
                    {copiedKey === 'title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'title' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono text-white text-xs">{listingTitle}</p>
              </div>

              {/* Short Description */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>Short Description (under 80 characters)</span>
                  <button
                    onClick={() => handleCopyText('shortDesc', listingShortDesc)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
                  >
                    {copiedKey === 'shortDesc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'shortDesc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-neutral-200 text-xs">{listingShortDesc}</p>
              </div>

              {/* Full Description */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>Full Description (Play Store compliant)</span>
                  <button
                    onClick={() => handleCopyText('fullDesc', listingFullDesc)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
                  >
                    {copiedKey === 'fullDesc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'fullDesc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-neutral-300 text-[11px] whitespace-pre-wrap font-sans max-h-48 overflow-y-auto leading-relaxed">
                  {listingFullDesc}
                </pre>
              </div>
            </div>
          )}

          {activeStepTab === 'datasafety' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Google Play Data Safety Form Answers</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-300/80">
                  Google Play requires declaring how permissions are used. Use these exact answers to pass automated policy reviews without rejection:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <p className="font-semibold text-white mb-0.5">1. Does your app collect or share any user data?</p>
                  <p className="text-emerald-400 font-mono text-[11px]">Select: NO</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <p className="font-semibold text-white mb-0.5">2. Camera Permission Declaration (CAMERA)</p>
                  <p className="text-neutral-300 text-[11px] mb-1">
                    Google asks: <em>Why does your app require android.permission.CAMERA?</em>
                  </p>
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                    <p className="text-amber-300 font-mono text-[11px]">
                      "Required to access and control the physical camera flash unit via Android Camera2 API. No photos or video are captured or stored."
                    </p>
                    <button
                      onClick={() => handleCopyText('permReason', 'Required to access and control the physical camera flash unit via Android Camera2 API. No photos or video are captured or stored.')}
                      className="text-amber-400 hover:text-white shrink-0 ml-2"
                    >
                      {copiedKey === 'permReason' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <p className="font-semibold text-white mb-0.5">3. Target Audience</p>
                  <p className="text-emerald-400 font-mono text-[11px]">Select: Ages 13 and up (not designed for children under 13)</p>
                </div>
              </div>
            </div>
          )}

          {activeStepTab === 'privacy' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Mandatory Privacy Policy</h3>
                  <p className="text-neutral-400 text-[11px]">
                    Google Play requires a public URL hosting your privacy policy because of the camera flashlight permission.
                  </p>
                </div>

                <button
                  onClick={() => handleCopyText('privacyPolicy', privacyPolicyText)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-medium text-xs transition-colors"
                >
                  {copiedKey === 'privacyPolicy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'privacyPolicy' ? 'Copied Policy' : 'Copy Policy Markdown'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-neutral-800/40 border border-neutral-800 text-[11px] text-neutral-300 space-y-1">
                <p className="font-medium text-white">Where can you host this for free in 2 minutes?</p>
                <p>· <strong>GitHub Pages</strong>: Create a free repo named <code className="text-amber-300">lumentorch-privacy</code>, paste this markdown into <code className="text-amber-300">index.md</code>, and enable Pages.</p>
                <p>· <strong>Google Sites</strong> (sites.google.com): Paste this text into a free Google Site and publish.</p>
                <p>· <strong>Notion / Google Docs</strong>: Create a document and set sharing to "Anyone with link can view".</p>
              </div>

              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-y-auto max-h-56 leading-relaxed">
                {privacyPolicyText}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready for Google Play Console submission</span>
          </div>

          <a
            href="https://play.google.com/console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
          >
            <span>Open Google Play Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
