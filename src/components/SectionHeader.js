import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SectionHeader = ({ title }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 2, width: '100%' }}>
        <LinearGradient
            colors={['transparent', 'rgba(212, 175, 55, 0.4)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flex: 1, height: 1 }}
        />
        <Text style={{
            fontFamily: 'Cinzel-Bold',
            color: '#d4af37',
            fontSize: 9,
            marginHorizontal: 12,
            letterSpacing: 1.2
        }}>
            {title}
        </Text>
        <LinearGradient
            colors={['rgba(212, 175, 55, 0.4)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flex: 1, height: 1 }}
        />
    </View>
);

export default SectionHeader;
