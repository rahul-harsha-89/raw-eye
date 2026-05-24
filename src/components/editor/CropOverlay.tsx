/**
 * CropOverlay — interactive crop handles rendered absolutely over the editor canvas.
 *
 * Shows a dark mask outside the crop region, a white border around it,
 * and four draggable L-bracket corner handles.
 *
 * cropRect in editorStore is normalized 0-1 relative to source image dimensions.
 */

import { StyleSheet, View } from 'react-native';
import { useEffect, useCallback, useMemo } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useEditorStore } from '../../store/editorStore';

const HANDLE = 32;   // touch target size for each corner
const ARM    = 14;   // L-bracket arm length
const ARM_T  = 3;    // L-bracket arm thickness
const MIN_PX = 48;   // minimum crop edge in canvas pixels

// ── L-bracket corner decoration ──────────────────────────────────────────────

function Corner({ tl, tr, bl, br }: {
  tl?: boolean; tr?: boolean; bl?: boolean; br?: boolean;
}) {
  const top    = tl || tr;
  const left   = tl || bl;
  const hStyle: object = {
    position: 'absolute' as const,
    width: ARM, height: ARM_T, backgroundColor: '#fff',
    ...(top    ? { top: 0 }    : { bottom: 0 }),
    ...(left   ? { left: 0 }   : { right: 0 }),
  };
  const vStyle: object = {
    position: 'absolute' as const,
    width: ARM_T, height: ARM, backgroundColor: '#fff',
    ...(top    ? { top: 0 }    : { bottom: 0 }),
    ...(left   ? { left: 0 }   : { right: 0 }),
  };
  return (
    <>
      <View style={hStyle} />
      <View style={vStyle} />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  canvasWidth: number;
  canvasHeight: number;
}

export default function CropOverlay({ canvasWidth, canvasHeight }: Props) {
  const { imageWidth, imageHeight, recipe, updateGeometry, pushUndo } = useEditorStore();

  // Image display rect inside the canvas (letterbox / pillarbox fit)
  const { iW, iH, iX, iY } = useMemo(() => {
    if (imageWidth <= 0 || imageHeight <= 0) {
      return { iW: canvasWidth, iH: canvasHeight, iX: 0, iY: 0 };
    }
    const imgA = imageWidth / imageHeight;
    const canA = canvasWidth / canvasHeight;
    if (imgA > canA) {
      const h = canvasWidth / imgA;
      return { iW: canvasWidth, iH: h, iX: 0, iY: (canvasHeight - h) / 2 };
    } else {
      const w = canvasHeight * imgA;
      return { iW: w, iH: canvasHeight, iX: (canvasWidth - w) / 2, iY: 0 };
    }
  }, [imageWidth, imageHeight, canvasWidth, canvasHeight]);

  // Crop → initial canvas pixel bounds
  const cr = recipe.geometry.cropRect ?? { x: 0, y: 0, width: 1, height: 1 };

  // Four shared values: left, top, right, bottom edges in canvas pixels
  const cL = useSharedValue(iX + cr.x * iW);
  const cT = useSharedValue(iY + cr.y * iH);
  const cR = useSharedValue(iX + (cr.x + cr.width) * iW);
  const cB = useSharedValue(iY + (cr.y + cr.height) * iH);

  // Start-of-gesture capture (reused by all 4 corner gestures)
  const sA = useSharedValue(0);
  const sB = useSharedValue(0);

  // Sync shared values when recipe changes externally (aspect chip / undo / redo)
  useEffect(() => {
    const c = recipe.geometry.cropRect ?? { x: 0, y: 0, width: 1, height: 1 };
    cL.value = iX + c.x * iW;
    cT.value = iY + c.y * iH;
    cR.value = iX + (c.x + c.width) * iW;
    cB.value = iY + (c.y + c.height) * iH;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.geometry.cropRect, iX, iY, iW, iH]);

  // Commit normalised crop to the store (JS thread)
  const commit = useCallback((l: number, t: number, r: number, b: number) => {
    const nx = (l - iX) / iW;
    const ny = (t - iY) / iH;
    const nw = (r - l) / iW;
    const nh = (b - t) / iH;
    updateGeometry('cropRect', {
      x:      Math.max(0, Math.min(1, nx)),
      y:      Math.max(0, Math.min(1, ny)),
      width:  Math.max(0.05, Math.min(1 - Math.max(0, nx), nw)),
      height: Math.max(0.05, Math.min(1 - Math.max(0, ny), nh)),
    });
  }, [iX, iY, iW, iH, updateGeometry]);

  // ── Corner gestures ───────────────────────────────────────────────────────

  const tlGesture = Gesture.Pan()
    .onBegin(() => {
      sA.value = cL.value;
      sB.value = cT.value;
      runOnJS(pushUndo)();
    })
    .onUpdate((e) => {
      cL.value = Math.max(iX,         Math.min(cR.value - MIN_PX, sA.value + e.translationX));
      cT.value = Math.max(iY,         Math.min(cB.value - MIN_PX, sB.value + e.translationY));
    })
    .onEnd(() => { runOnJS(commit)(cL.value, cT.value, cR.value, cB.value); });

  const trGesture = Gesture.Pan()
    .onBegin(() => {
      sA.value = cR.value;
      sB.value = cT.value;
      runOnJS(pushUndo)();
    })
    .onUpdate((e) => {
      cR.value = Math.min(iX + iW,    Math.max(cL.value + MIN_PX, sA.value + e.translationX));
      cT.value = Math.max(iY,         Math.min(cB.value - MIN_PX, sB.value + e.translationY));
    })
    .onEnd(() => { runOnJS(commit)(cL.value, cT.value, cR.value, cB.value); });

  const blGesture = Gesture.Pan()
    .onBegin(() => {
      sA.value = cL.value;
      sB.value = cB.value;
      runOnJS(pushUndo)();
    })
    .onUpdate((e) => {
      cL.value = Math.max(iX,         Math.min(cR.value - MIN_PX, sA.value + e.translationX));
      cB.value = Math.min(iY + iH,    Math.max(cT.value + MIN_PX, sB.value + e.translationY));
    })
    .onEnd(() => { runOnJS(commit)(cL.value, cT.value, cR.value, cB.value); });

  const brGesture = Gesture.Pan()
    .onBegin(() => {
      sA.value = cR.value;
      sB.value = cB.value;
      runOnJS(pushUndo)();
    })
    .onUpdate((e) => {
      cR.value = Math.min(iX + iW,    Math.max(cL.value + MIN_PX, sA.value + e.translationX));
      cB.value = Math.min(iY + iH,    Math.max(cT.value + MIN_PX, sB.value + e.translationY));
    })
    .onEnd(() => { runOnJS(commit)(cL.value, cT.value, cR.value, cB.value); });

  // ── Animated styles ────────────────────────────────────────────────────────

  const sMaskTop = useAnimatedStyle(() => ({
    height: Math.max(0, cT.value),
  }));
  const sMaskBot = useAnimatedStyle(() => ({
    top:    cB.value,
    height: Math.max(0, canvasHeight - cB.value),
  }));
  const sMaskLeft = useAnimatedStyle(() => ({
    top:    cT.value,
    width:  Math.max(0, cL.value),
    height: Math.max(0, cB.value - cT.value),
  }));
  const sMaskRight = useAnimatedStyle(() => ({
    top:    cT.value,
    left:   cR.value,
    width:  Math.max(0, canvasWidth - cR.value),
    height: Math.max(0, cB.value - cT.value),
  }));
  const sCropBorder = useAnimatedStyle(() => ({
    top:    cT.value,
    left:   cL.value,
    width:  Math.max(0, cR.value - cL.value),
    height: Math.max(0, cB.value - cT.value),
  }));
  const sTL = useAnimatedStyle(() => ({ top: cT.value - HANDLE / 2, left: cL.value - HANDLE / 2 }));
  const sTR = useAnimatedStyle(() => ({ top: cT.value - HANDLE / 2, left: cR.value - HANDLE / 2 }));
  const sBL = useAnimatedStyle(() => ({ top: cB.value - HANDLE / 2, left: cL.value - HANDLE / 2 }));
  const sBR = useAnimatedStyle(() => ({ top: cB.value - HANDLE / 2, left: cR.value - HANDLE / 2 }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* Dark mask — 4 bars around crop region */}
      <Animated.View style={[styles.mask, styles.maskHFull, sMaskTop]} />
      <Animated.View style={[styles.mask, styles.maskHFull, sMaskBot]} />
      <Animated.View style={[styles.mask,                   sMaskLeft]} />
      <Animated.View style={[styles.mask,                   sMaskRight]} />

      {/* Crop border */}
      <Animated.View style={[styles.cropBorder, sCropBorder]} />

      {/* TL corner */}
      <GestureDetector gesture={tlGesture}>
        <Animated.View style={[styles.handle, sTL]}>
          <Corner tl />
        </Animated.View>
      </GestureDetector>

      {/* TR corner */}
      <GestureDetector gesture={trGesture}>
        <Animated.View style={[styles.handle, sTR]}>
          <Corner tr />
        </Animated.View>
      </GestureDetector>

      {/* BL corner */}
      <GestureDetector gesture={blGesture}>
        <Animated.View style={[styles.handle, sBL]}>
          <Corner bl />
        </Animated.View>
      </GestureDetector>

      {/* BR corner */}
      <GestureDetector gesture={brGesture}>
        <Animated.View style={[styles.handle, sBR]}>
          <Corner br />
        </Animated.View>
      </GestureDetector>

    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  maskHFull: {
    left: 0,
    right: 0,
  },
  cropBorder: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
  },
});
