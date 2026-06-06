import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type NavTab = 'home' | 'legal' | 'academia' | 'perfil';

interface Props {
  active: NavTab;
  onPress: (tab: NavTab) => void;
}

const TABS: { id: NavTab; label: string; icon: string; iconActive: string }[] = [
  { id: 'home',     label: 'Inicio',   icon: 'home-outline',         iconActive: 'home'                },
  { id: 'legal',    label: 'Legal',    icon: 'shield-outline',       iconActive: 'shield'              },
  { id: 'academia', label: 'Academia', icon: 'school-outline',       iconActive: 'school'              },
  { id: 'perfil',   label: 'Perfil',   icon: 'person-circle-outline', iconActive: 'person-circle'      },
];

export function BottomNav({ active, onPress }: Props) {
  const ins = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingBottom: ins.bottom || 12 }]}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={s.tab}
            onPress={() => onPress(tab.id)}
            activeOpacity={0.7}
          >
            {isActive && <View style={s.indicator} />}
            <Ionicons
              name={(isActive ? tab.iconActive : tab.icon) as any}
              size={24}
              color={isActive ? '#F4ACB7' : '#9D818970'}
            />
            <Text style={[s.label, isActive && s.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#FFF0F4',
    elevation: 12,
    shadowColor: '#F4ACB7',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    gap: 3,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: '#F4ACB7',
    borderRadius: 99,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9D818970',
  },
  labelActive: {
    color: '#F4ACB7',
    fontWeight: '800',
  },
});
