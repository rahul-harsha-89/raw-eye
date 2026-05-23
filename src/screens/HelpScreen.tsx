import { ScrollView, View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import Text from '../components/Text';
import IconButton from '../components/IconButton';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

// ─── Data ────────────────────────────────────────────────────────────────────

interface HelpItem {
  name: string;
  description: string;
  tip?: string;
}

interface HelpSection {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  items: HelpItem[];
}

const SECTIONS: HelpSection[] = [
  {
    icon: 'brightness-6',
    title: 'Light',
    subtitle: 'Control exposure and tonal range',
    items: [
      {
        name: 'Exposure',
        description: 'Increases or decreases the overall brightness of the photo, measured in stops. +1 doubles the light; −1 halves it.',
        tip: 'Use this first. Get the overall brightness close before touching anything else.',
      },
      {
        name: 'Contrast',
        description: 'Pushes dark areas darker and bright areas brighter. Positive values add punch; negative values create a flatter, film-like look.',
        tip: 'High contrast can crush shadow detail. Recover it with Shadows after.',
      },
      {
        name: 'Highlights',
        description: 'Pulls back or boosts only the brightest parts of the image — skies, windows, skin in direct sun. Negative values recover blown-out areas.',
        tip: 'Start by pulling highlights down (−30 to −60) before raising exposure.',
      },
      {
        name: 'Shadows',
        description: 'Lifts or deepens the darkest areas without affecting highlights. Positive values open up shadow detail; negative values deepen atmosphere.',
        tip: 'Lifting shadows on portraits reveals face detail in backlit shots.',
      },
      {
        name: 'Whites',
        description: 'Sets the absolute brightest point. Positive values push the brightest tones toward pure white; negative values cap the highlights lower.',
      },
      {
        name: 'Blacks',
        description: 'Sets the darkest point. Negative values push deep shadows toward pure black, increasing contrast. Positive values lift the black floor for a faded look.',
      },
    ],
  },
  {
    icon: 'palette',
    title: 'Color',
    subtitle: 'Colour balance and saturation',
    items: [
      {
        name: 'Temperature',
        description: 'Warms (positive) or cools (negative) the entire image. Use it to fix mixed lighting or set a mood — warm for golden hour, cool for overcast.',
        tip: 'For skin tones, a slight warm push (+10 to +25) is almost always flattering.',
      },
      {
        name: 'Tint',
        description: 'Adjusts the green–magenta balance. Positive adds magenta; negative adds green. Often used to fix fluorescent light casts.',
      },
      {
        name: 'Vibrance',
        description: 'Boosts the saturation of muted colours more than already-vivid colours. Skin-safe: it avoids over-saturating orange and red tones.',
        tip: 'Vibrance is the smarter saturation. Use it first; only add raw Saturation if you need more.',
      },
      {
        name: 'Saturation',
        description: 'Boosts or reduces all colours equally. Pushing it too high quickly makes skin tones look unnaturally orange. Pulling it to −100 converts to monochrome.',
        tip: 'If in doubt, use Vibrance instead. Keep Saturation adjustments small (±20).',
      },
    ],
  },
  {
    icon: 'grain',
    title: 'Detail',
    subtitle: 'Sharpness and noise reduction',
    items: [
      {
        name: 'Sharpness',
        description: 'Enhances edges to make the image look crisper. Applied via an unsharp-mask algorithm — it increases micro-contrast at edges without affecting smooth areas.',
        tip: 'Apply sharpness after noise reduction. 20–40 is a good starting range for exports.',
      },
      {
        name: 'NR Luminance',
        description: 'Reduces luminance (brightness) noise — the grainy sand-like texture common in high-ISO or underexposed shots.',
        tip: 'This softens fine detail. Balance it with Sharpness afterward.',
      },
      {
        name: 'NR Color',
        description: 'Removes colour noise — the random red/green/blue speckles that appear in shadows and high-ISO photos. Usually safe to push higher than Luminance NR.',
      },
      {
        name: 'Texture Recovery',
        description: 'Attempts to recover fine surface texture (fabric, skin, rock) that can be lost when applying noise reduction or heavy saturation.',
      },
    ],
  },
  {
    icon: 'vignette',
    title: 'Optics',
    subtitle: 'Lens effects',
    items: [
      {
        name: 'Vignette',
        description: 'Darkens (negative) or brightens (positive) the edges of the frame. A subtle dark vignette naturally draws the eye to the centre subject.',
        tip: '−15 to −30 gives a natural-looking vignette. Anything below −60 becomes obviously stylised.',
      },
      {
        name: 'Chromatic Aberration',
        description: 'Toggle to remove colour fringing — the purple or green outlines that appear on high-contrast edges, especially with wide-aperture lenses.',
      },
    ],
  },
  {
    icon: 'crop',
    title: 'Geometry',
    subtitle: 'Crop and straighten',
    items: [
      {
        name: 'Aspect Ratio',
        description: 'Crops the image to a standard ratio. Free removes the crop constraint. 1:1 is square (Instagram). 16:9 is widescreen. 9:16 is phone portrait. 4:3 and 3:2 match camera sensor formats.',
        tip: 'The crop is applied to the preview and the final exported file — no quality is lost.',
      },
      {
        name: 'Rotation / Straighten',
        description: 'Rotates the photo up to ±45°. Use it to fix a tilted horizon. The image is rotated in-place around its centre.',
        tip: 'Drag the slider slowly — it moves in 0.1° steps for precision horizon correction.',
      },
    ],
  },
  {
    icon: 'auto-awesome',
    title: 'Presets',
    subtitle: 'One-tap film and style looks',
    items: [
      {
        name: 'Film Emulation',
        description: 'Accurate recreations of real film stocks: Kodak Portra 400 (warm portraits), Fuji Velvia 50 (vivid landscapes), Cinestill 800T (neon nights), Kodak Ektar 100 (bold travel).',
      },
      {
        name: 'Landscape',
        description: '16 presets covering every lighting condition: golden hour warmth, blue hour twilight, misty morning, dramatic storm, alpine clarity, deep forest greens, coastal teal, and more.',
      },
      {
        name: 'Portrait',
        description: '12 presets for people: Soft Skin (flattering warmth), Editorial (cool fashion), Warm Glow (golden hour couples), Studio Power (high-contrast studio), Backlit (rim light recovery), and more.',
      },
      {
        name: 'Black & White',
        description: '8 B&W conversions including 6 inspired by master photographers: Ansel Adams (Zone System), Henri Cartier-Bresson (documentary), Sebastião Salgado (epic drama), Diane Arbus (flat grit), Edward Weston (platinum gradients), Helmut Newton (graphic fashion).',
      },
      {
        name: 'Intensity Slider',
        description: 'Every preset has an intensity slider (0–100%) so you can blend the look with the original. 100% is the full preset. 50% is a subtle hint. 0% is the original photo.',
        tip: '70–85% often looks more natural than 100% for film emulation presets.',
      },
    ],
  },
  {
    icon: 'psychology',
    title: 'AI Style',
    subtitle: 'Neural style transfer',
    items: [
      {
        name: 'How It Works',
        description: 'Analyses the colour palette and tonal character of a reference style image and applies it to your photo. All processing happens on-device — no internet required.',
      },
      {
        name: 'Intensity',
        description: 'Controls how strongly the AI style is applied. Lower values blend subtly into the photo; higher values transform the colour grade dramatically.',
        tip: 'AI Style stacks with presets and manual adjustments. Apply presets first, then fine-tune with AI Style on top.',
      },
    ],
  },
  {
    icon: 'build',
    title: 'Tools',
    subtitle: 'Utilities and comparison',
    items: [
      {
        name: 'Before / After',
        description: 'Toggles between your edited version and the original unedited photo. Use it to check how far your edits have taken the image.',
        tip: 'Tap quickly back and forth to assess if your edits are helping or hurting.',
      },
      {
        name: 'Flatten & Enhance',
        description: 'Bakes all current adjustments into the source image, then clears the edit recipe. The result becomes your new starting point. Use this when you want to apply another round of edits on top of your existing work — preserving all quality from the first pass.',
        tip: 'Tap EXPORT first to capture a snapshot, then use Flatten & Enhance to lock it in.',
      },
      {
        name: 'Reset All',
        description: 'Clears every adjustment — light, color, detail, optics, geometry, presets, and AI style — and returns to the unedited original. Supports undo.',
      },
    ],
  },
  {
    icon: 'file-download',
    title: 'Export',
    subtitle: 'Save to your gallery',
    items: [
      {
        name: 'Format',
        description: 'JPEG is the standard for sharing and printing — smaller files, universal compatibility. PNG is lossless — larger files, no compression artefacts. Use PNG for graphics or images that need pixel-perfect accuracy.',
      },
      {
        name: 'Quality (JPEG only)',
        description: 'Controls JPEG compression. 95% is visually indistinguishable from 100% but meaningfully smaller. Below 80% compression artefacts become visible, especially in smooth gradients.',
        tip: '92–95% is the professional sweet spot for sharing. 100% for archiving.',
      },
      {
        name: 'Output Size',
        description: 'Original uses the full source resolution (no upscaling). Other sizes fit the image within a fixed pixel boundary without upscaling — a 10 MP image exported at "4K" still outputs at 10 MP.',
        tip: 'Always use Original for archiving. Use Social (1080×1080) for Instagram posts to avoid the platform recompressing your file.',
      },
      {
        name: 'Keep EXIF Metadata',
        description: 'EXIF data includes camera model, ISO, aperture, shutter speed, GPS location, and date. Toggle off to strip it before sharing publicly if privacy matters.',
      },
    ],
  },
  {
    icon: 'bar-chart',
    title: 'Histogram',
    subtitle: 'Reading tonal distribution',
    items: [
      {
        name: 'What It Shows',
        description: 'The histogram is a graph of how many pixels exist at each brightness level. Left edge = pure black. Right edge = pure white. Taller bars mean more pixels at that brightness. Red, green, and blue channels are shown overlaid.',
      },
      {
        name: 'Clipping',
        description: 'If bars pile up against the left wall, shadows are clipped (pure black, no detail). Bars piling up on the right mean blown highlights. Neither is always wrong — it depends on your intent.',
        tip: 'A portrait with a white background will naturally have a spike on the right. A silhouette will spike on the left.',
      },
      {
        name: 'Moving It',
        description: 'The histogram overlay is draggable — press and drag it anywhere on the canvas to reposition it so it does not cover your subject.',
      },
    ],
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="headlineMd" color="onSurface">{title}</Text>
        <Text variant="monoData" color="onSurfaceVariant">{subtitle}</Text>
      </View>
    </View>
  );
}

function HelpEntry({ name, description, tip }: HelpItem) {
  return (
    <View style={styles.entry}>
      <Text variant="labelSm" color="onSurface" style={styles.entryName}>{name}</Text>
      <Text variant="monoData" color="onSurfaceVariant" style={styles.entryDesc}>{description}</Text>
      {tip && (
        <View style={styles.tipRow}>
          <MaterialIcons name="lightbulb-outline" size={13} color={colors.primary} />
          <Text variant="monoData" color="primary" style={styles.tipText}>{tip}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HelpScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text variant="headlineMd" color="onSurface">User Guide</Text>
        <View style={{ width: spacing.touchTarget }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.intro}>
          <Text variant="monoData" color="onSurfaceVariant" style={styles.introText}>
            RAW Eye is a professional offline photo editor. Every adjustment is
            non-destructive — your original file is never modified. Use undo (↩)
            anytime to step back through your edits.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <SectionHeader
              icon={section.icon}
              title={section.title}
              subtitle={section.subtitle}
            />
            <View style={styles.divider} />
            {section.items.map((item) => (
              <HelpEntry key={item.name} {...item} />
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="monoData" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
            All processing is done on-device. No internet required.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    height: spacing.touchTarget + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.edgeMargin,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 48,
  },
  intro: {
    paddingHorizontal: spacing.edgeMargin,
    paddingTop: spacing.gutter * 2,
    paddingBottom: spacing.gutter,
  },
  introText: {
    lineHeight: 18,
  },
  section: {
    marginTop: spacing.gutter * 2,
    paddingHorizontal: spacing.edgeMargin,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutter,
    paddingBottom: spacing.unit * 2,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.gutter,
  },
  entry: {
    paddingVertical: spacing.gutter,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
    gap: spacing.unit,
  },
  entryName: {
    letterSpacing: 0.2,
  },
  entryDesc: {
    lineHeight: 17,
    opacity: 0.85,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.unit,
    marginTop: spacing.unit,
    backgroundColor: colors.primaryContainer + '18',
    borderRadius: 4,
    padding: spacing.unit * 2,
  },
  tipText: {
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    marginTop: spacing.gutter * 3,
    paddingHorizontal: spacing.edgeMargin,
    paddingBottom: spacing.gutter,
  },
});
