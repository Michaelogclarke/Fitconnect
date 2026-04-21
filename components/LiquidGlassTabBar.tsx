import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors, useTheme } from '@/contexts/ThemeContext';

const SPRING = { damping: 22, stiffness: 220 } as const;
const BAR_HEIGHT = 64;
const INDICATOR_HEIGHT = 48;
const H_PAD = 4;

type TabDef = {
  href: string;
  title: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
};

const BASE_TABS: TabDef[] = [
  { href: '/',          title: 'Home',     icon: 'house.fill' },
  { href: '/plans',     title: 'Plans',    icon: 'list.bullet' },
  { href: '/progress',  title: 'Progress', icon: 'chart.bar.fill' },
  { href: '/nutrition', title: 'Nutrition',icon: 'fork.knife' },
];

const TRAINER_TAB: TabDef = { href: '/trainer', title: 'Trainer', icon: 'person.2.fill' };

function getActiveIndex(pathname: string, tabs: TabDef[]): number {
  const idx = tabs.findIndex((t) =>
    t.href === '/' ? pathname === '/' || pathname === '/(tabs)' : pathname.startsWith(t.href),
  );
  return idx >= 0 ? idx : 0;
}

interface Props {
  showTrainer: boolean;
}

export function LiquidGlassTabBar({ showTrainer }: Props) {
  const C = useColors();
  const { isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = showTrainer ? [...BASE_TABS, TRAINER_TAB] : BASE_TABS;
  const activeIndex = getActiveIndex(pathname, tabs);
  const tabCount = tabs.length;

  const barWidth = useSharedValue(0);
  const tabWidth = useSharedValue(0);
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (barWidth.value === 0) return;
    const tw = (barWidth.value - H_PAD * 2) / tabCount;
    tabWidth.value = tw;
    indicatorX.value = withSpring(activeIndex * tw + H_PAD, SPRING);
  }, [activeIndex, tabCount]);

  function onBarLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    barWidth.value = w;
    const tw = (w - H_PAD * 2) / tabCount;
    tabWidth.value = tw;
    // set without animation on first layout
    indicatorX.value = activeIndex * tw + H_PAD;
  }

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 12 }]}>
      <BlurView
        intensity={70}
        tint={isDark ? 'dark' : 'light'}
        style={styles.pill}
        onLayout={onBarLayout}>

        {/* sliding accent indicator */}
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            { backgroundColor: C.primary + '28', borderColor: C.primary + '60' },
          ]}
        />

        {tabs.map((tab, i) => {
          const isFocused = i === activeIndex;
          const color = isFocused ? C.tabIconSelected : C.tabIconDefault;

          function onPress() {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            if (!isFocused) {
              router.navigate(tab.href as never);
            }
          }

          return (
            <Pressable
              key={tab.href}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              style={styles.tabButton}>
              <IconSymbol size={22} name={tab.icon} color={color} />
              <Text style={[styles.label, { color }]}>{tab.title}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    borderRadius: 32,
  },
  pill: {
    height: BAR_HEIGHT,
    borderRadius: 32,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    height: INDICATOR_HEIGHT,
    top: (BAR_HEIGHT - INDICATOR_HEIGHT) / 2,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
