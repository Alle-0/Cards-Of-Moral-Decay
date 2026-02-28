import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PremiumPressable from './PremiumPressable';
import { CardsIcon, ThornsIcon, HornsIcon, CheckIcon, LockIcon, EyeIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

const MinimalPackCard = ({ label, type, selected, onPress, owned = true, onPreview, style }) => {
    const isDark = type === 'dark';
    const isChill = type === 'chill';
    const isSpicy = type === 'spicy';

    const SpicyIcon = HornsIcon || (() => <View style={{ width: 16, height: 16, backgroundColor: 'purple' }} />);

    let baseColor = '#FDB931'; // Default Gold (Base)
    if (isDark) baseColor = '#ef4444';
    if (isChill) baseColor = '#38bdf8';
    if (isSpicy) baseColor = '#d946ef';
    const { t } = useLanguage();

    return (
        <View style={[{ height: 50, marginBottom: 0 }, style]}>
            <PremiumPressable
                onPress={owned ? onPress : null}
                scaleDown={0.97}
                style={{
                    width: '100%',
                    height: '100%',
                    opacity: owned ? 1 : 0.6
                }}
                contentContainerStyle={{ height: '100%' }}
            >
                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: selected ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.4)',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    borderWidth: 1,
                    borderColor: selected ? baseColor : 'rgba(255,255,255,0.05)',
                    height: '100%',
                    paddingRight: 35
                }}>
                    <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: selected ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.02)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        borderWidth: selected ? 1 : 0,
                        borderColor: 'rgba(255,255,255,0.05)'
                    }}>
                        {isDark ? <ThornsIcon size={16} color={selected ? baseColor : '#555'} /> :
                            (isChill ? <View style={{ transform: [{ scale: 0.8 }] }}><CardsIcon size={16} color={selected ? baseColor : '#555'} /></View> :
                                (isSpicy ? <SpicyIcon size={16} color={selected ? baseColor : '#555'} /> :
                                    <CardsIcon size={16} color={selected ? baseColor : '#555'} />))
                        }
                    </View>

                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{
                            fontFamily: 'Cinzel-Bold',
                            color: selected ? baseColor : '#888',
                            fontSize: 10,
                            letterSpacing: 0.5
                        }} numberOfLines={1}>
                            {label}
                        </Text>
                        <Text style={{ fontFamily: 'Outfit', fontSize: 7, color: '#444' }} numberOfLines={1}>
                            {isDark ? t('adult_content') : (isChill ? t('chill_content') : (isSpicy ? t('spicy_content') : t('starter_set')))}
                        </Text>
                    </View>
                </View>
            </PremiumPressable>

            <View
                style={{
                    position: 'absolute',
                    right: 4,
                    top: 0,
                    bottom: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    pointerEvents: 'box-none'
                }}
            >
                {onPreview && (
                    <TouchableOpacity
                        onPress={onPreview}
                        style={{ padding: 4 }}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <EyeIcon size={16} color="#d4af37" />
                    </TouchableOpacity>
                )}
                {!owned && <LockIcon size={12} color="#444" />}
                {owned && selected && <CheckIcon size={12} color={baseColor} />}
            </View>
        </View >
    );
};

export default MinimalPackCard;
