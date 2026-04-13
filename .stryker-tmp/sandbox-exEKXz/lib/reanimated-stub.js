/**
 * Safe no-op stub for react-native-reanimated on web.
 *
 * Metro resolves this file instead of the real Reanimated package on the web
 * platform (see metro.config.js). This prevents the "Cannot convert undefined
 * or null to object" crash that Reanimated's native initializer throws in a
 * browser environment.
 *
 * react-native-gesture-handler checks `Reanimated?.useSharedValue`; when that
 * is absent it falls back to its own non-Reanimated implementation, so
 * GestureHandlerRootView continues to work normally.
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { View, Text, Image, ScrollView, FlatList, Pressable } from 'react-native';
const noop = () => {};
const identity = stryMutAct_9fa48("4392") ? () => undefined : (stryCov_9fa48("4392"), (() => {
  const identity = x => x;
  return identity;
})());
export default stryMutAct_9fa48("4393") ? {} : (stryCov_9fa48("4393"), {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  Pressable,
  // Added common components
  createAnimatedComponent: identity
});

// Helper to mimic a shared value structure { value: ... }
const useSharedValueRaw = stryMutAct_9fa48("4394") ? () => undefined : (stryCov_9fa48("4394"), (() => {
  const useSharedValueRaw = init => stryMutAct_9fa48("4395") ? {} : (stryCov_9fa48("4395"), {
    value: init
  });
  return useSharedValueRaw;
})());
export const createAnimatedComponent = identity;
export const useSharedValue = useSharedValueRaw;
export const useAnimatedStyle = stryMutAct_9fa48("4396") ? () => undefined : (stryCov_9fa48("4396"), (() => {
  const useAnimatedStyle = () => ({});
  return useAnimatedStyle;
})());
export const useAnimatedProps = stryMutAct_9fa48("4397") ? () => undefined : (stryCov_9fa48("4397"), (() => {
  const useAnimatedProps = () => ({});
  return useAnimatedProps;
})());
export const withSpring = identity;
export const withTiming = identity;
export const withRepeat = identity;
export const withSequence = stryMutAct_9fa48("4398") ? () => undefined : (stryCov_9fa48("4398"), (() => {
  const withSequence = (...args) => args[0];
  return withSequence;
})());
export const withDelay = stryMutAct_9fa48("4399") ? () => undefined : (stryCov_9fa48("4399"), (() => {
  const withDelay = (_, val) => val;
  return withDelay;
})());
export const withDecay = identity;
export const withClamp = identity;
export const runOnJS = stryMutAct_9fa48("4400") ? () => undefined : (stryCov_9fa48("4400"), (() => {
  const runOnJS = fn => fn;
  return runOnJS;
})());
export const runOnUI = stryMutAct_9fa48("4401") ? () => undefined : (stryCov_9fa48("4401"), (() => {
  const runOnUI = fn => fn;
  return runOnUI;
})());
export const makeMutable = stryMutAct_9fa48("4402") ? () => undefined : (stryCov_9fa48("4402"), (() => {
  const makeMutable = val => stryMutAct_9fa48("4403") ? {} : (stryCov_9fa48("4403"), {
    value: val
  });
  return makeMutable;
})());
export const useAnimatedReaction = noop;
export const useDerivedValue = stryMutAct_9fa48("4404") ? () => undefined : (stryCov_9fa48("4404"), (() => {
  const useDerivedValue = fn => stryMutAct_9fa48("4405") ? {} : (stryCov_9fa48("4405"), {
    value: fn()
  });
  return useDerivedValue;
})());
export const useAnimatedRef = stryMutAct_9fa48("4406") ? () => undefined : (stryCov_9fa48("4406"), (() => {
  const useAnimatedRef = () => stryMutAct_9fa48("4407") ? {} : (stryCov_9fa48("4407"), {
    current: null
  });
  return useAnimatedRef;
})());
export const useFrameCallback = noop;
export const useScrollOffset = stryMutAct_9fa48("4408") ? () => undefined : (stryCov_9fa48("4408"), (() => {
  const useScrollOffset = () => stryMutAct_9fa48("4409") ? {} : (stryCov_9fa48("4409"), {
    value: 0
  });
  return useScrollOffset;
})());
export const useAnimatedScrollHandler = stryMutAct_9fa48("4410") ? () => undefined : (stryCov_9fa48("4410"), (() => {
  const useAnimatedScrollHandler = () => ({});
  return useAnimatedScrollHandler;
})());
export const useAnimatedKeyboard = stryMutAct_9fa48("4411") ? () => undefined : (stryCov_9fa48("4411"), (() => {
  const useAnimatedKeyboard = () => stryMutAct_9fa48("4412") ? {} : (stryCov_9fa48("4412"), {
    height: stryMutAct_9fa48("4413") ? {} : (stryCov_9fa48("4413"), {
      value: 0
    }),
    state: stryMutAct_9fa48("4414") ? {} : (stryCov_9fa48("4414"), {
      value: 0
    })
  });
  return useAnimatedKeyboard;
})());
export const useAnimatedSensor = stryMutAct_9fa48("4415") ? () => undefined : (stryCov_9fa48("4415"), (() => {
  const useAnimatedSensor = () => stryMutAct_9fa48("4416") ? {} : (stryCov_9fa48("4416"), {
    sensor: stryMutAct_9fa48("4417") ? {} : (stryCov_9fa48("4417"), {
      value: {}
    }),
    unregister: noop
  });
  return useAnimatedSensor;
})());
export const useReducedMotion = stryMutAct_9fa48("4418") ? () => undefined : (stryCov_9fa48("4418"), (() => {
  const useReducedMotion = () => stryMutAct_9fa48("4419") ? true : (stryCov_9fa48("4419"), false);
  return useReducedMotion;
})());
export const interpolate = stryMutAct_9fa48("4420") ? () => undefined : (stryCov_9fa48("4420"), (() => {
  const interpolate = (val, _input, output) => stryMutAct_9fa48("4421") ? output[0] && val : (stryCov_9fa48("4421"), output[0] ?? val);
  return interpolate;
})());
export const interpolateColor = stryMutAct_9fa48("4422") ? () => undefined : (stryCov_9fa48("4422"), (() => {
  const interpolateColor = (val, _input, output) => stryMutAct_9fa48("4423") ? output[0] && '#000' : (stryCov_9fa48("4423"), output[0] ?? (stryMutAct_9fa48("4424") ? "" : (stryCov_9fa48("4424"), '#000')));
  return interpolateColor;
})());
export const Easing = stryMutAct_9fa48("4425") ? {} : (stryCov_9fa48("4425"), {
  linear: identity,
  ease: identity,
  quad: identity,
  cubic: identity,
  sin: identity,
  circle: identity,
  exp: identity,
  elastic: stryMutAct_9fa48("4426") ? () => undefined : (stryCov_9fa48("4426"), () => identity),
  back: stryMutAct_9fa48("4427") ? () => undefined : (stryCov_9fa48("4427"), () => identity),
  bounce: identity,
  bezier: stryMutAct_9fa48("4428") ? () => undefined : (stryCov_9fa48("4428"), () => identity),
  in: identity,
  out: identity,
  inOut: identity
});
export const Extrapolation = stryMutAct_9fa48("4429") ? {} : (stryCov_9fa48("4429"), {
  CLAMP: stryMutAct_9fa48("4430") ? "" : (stryCov_9fa48("4430"), 'clamp'),
  EXTEND: stryMutAct_9fa48("4431") ? "" : (stryCov_9fa48("4431"), 'extend'),
  IDENTITY: stryMutAct_9fa48("4432") ? "" : (stryCov_9fa48("4432"), 'identity')
});
export const ReduceMotion = stryMutAct_9fa48("4433") ? {} : (stryCov_9fa48("4433"), {
  System: stryMutAct_9fa48("4434") ? "" : (stryCov_9fa48("4434"), 'system'),
  Always: stryMutAct_9fa48("4435") ? "" : (stryCov_9fa48("4435"), 'always'),
  Never: stryMutAct_9fa48("4436") ? "" : (stryCov_9fa48("4436"), 'never')
});
export const cancelAnimation = noop;
export const measure = stryMutAct_9fa48("4437") ? () => undefined : (stryCov_9fa48("4437"), (() => {
  const measure = () => null;
  return measure;
})());
export const scrollTo = noop;
export const dispatchCommand = noop;
export const setNativeProps = noop;
export const enableLayoutAnimations = noop;
export const configureReanimatedLogger = noop;
export const isReanimated3 = stryMutAct_9fa48("4438") ? () => undefined : (stryCov_9fa48("4438"), (() => {
  const isReanimated3 = () => stryMutAct_9fa48("4439") ? true : (stryCov_9fa48("4439"), false);
  return isReanimated3;
})());
export const isConfigured = stryMutAct_9fa48("4440") ? () => undefined : (stryCov_9fa48("4440"), (() => {
  const isConfigured = () => stryMutAct_9fa48("4441") ? true : (stryCov_9fa48("4441"), false);
  return isConfigured;
})());

// Layout animation builders — return null on web (no-op)
const noopBuilder = stryMutAct_9fa48("4442") ? {} : (stryCov_9fa48("4442"), {
  duration: stryMutAct_9fa48("4443") ? () => undefined : (stryCov_9fa48("4443"), () => noopBuilder),
  delay: stryMutAct_9fa48("4444") ? () => undefined : (stryCov_9fa48("4444"), () => noopBuilder),
  easing: stryMutAct_9fa48("4445") ? () => undefined : (stryCov_9fa48("4445"), () => noopBuilder),
  springify: stryMutAct_9fa48("4446") ? () => undefined : (stryCov_9fa48("4446"), () => noopBuilder),
  damping: stryMutAct_9fa48("4447") ? () => undefined : (stryCov_9fa48("4447"), () => noopBuilder),
  stiffness: stryMutAct_9fa48("4448") ? () => undefined : (stryCov_9fa48("4448"), () => noopBuilder),
  build: stryMutAct_9fa48("4449") ? () => undefined : (stryCov_9fa48("4449"), () => null)
});
export const FadeIn = noopBuilder;
export const FadeOut = noopBuilder;
export const FadeInDown = noopBuilder;
export const FadeInUp = noopBuilder;
export const FadeInLeft = noopBuilder;
export const FadeInRight = noopBuilder;
export const FadeOutDown = noopBuilder;
export const FadeOutUp = noopBuilder;
export const SlideInDown = noopBuilder;
export const SlideInUp = noopBuilder;
export const SlideOutDown = noopBuilder;
export const SlideOutUp = noopBuilder;
export const ZoomIn = noopBuilder;
export const ZoomOut = noopBuilder;
export const ZoomInDown = noopBuilder;
export const ZoomInUp = noopBuilder;
export const BounceIn = noopBuilder;
export const BounceOut = noopBuilder;
export const Layout = noopBuilder;
export const LinearTransition = noopBuilder;