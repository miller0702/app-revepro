import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTabBarScrollStore } from '../stores/tabBarScrollStore';

const THRESHOLD = 8;
const TOP_EXPAND = 24;

/**
 * Conecta FlatList/ScrollView al tab bar flotante:
 * scroll hacia abajo → compacto; hacia arriba / cerca del top → expandido.
 */
export function useTabBarScrollHandler() {
  const lastY = useRef(0);
  const setCollapse = useTabBarScrollStore((s) => s.setCollapse);
  const expand = useTabBarScrollStore((s) => s.expand);

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;

      if (y <= TOP_EXPAND) {
        expand();
        lastY.current = y;
        return;
      }

      if (Math.abs(dy) < THRESHOLD) return;

      if (dy > 0) {
        setCollapse(1);
      } else {
        setCollapse(0);
      }
      lastY.current = y;
    },
    [expand, setCollapse],
  );
}
