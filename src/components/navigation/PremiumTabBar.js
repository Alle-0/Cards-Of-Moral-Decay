import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScaleIcon, PaletteIcon, PlayIcon, PeopleIcon, SettingsIcon } from '../../components/Icons';
import EfficientBlurView from '../EfficientBlurView';

const PremiumTabBar = ({ state, descriptors, navigation }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { width } = Dimensions.get('window');

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
            {/* Background Bar with Blur */}
            <View style={[styles.barBackground, { width: width * 0.94, overflow: 'hidden' }]}>
                <EfficientBlurView
                    intensity={50}
                    tint="dark"
                    force={true}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <View style={styles.content}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    let IconComponent = PlayIcon;
                    let isCenter = false;

                    switch (route.name) {
                        case 'Shop': // Banca -> Shop (Acquisti)
                            IconComponent = ScaleIcon;
                            break;
                        case 'Stile': // Custom -> Stile (Inventario)
                            IconComponent = PaletteIcon;
                            break;
                        case 'Lobby': // Gioca (Centro)
                            IconComponent = PlayIcon;
                            isCenter = true;
                            break;
                        case 'Friends': // Complici
                            IconComponent = PeopleIcon;
                            break;
                        case 'Settings': // Opzioni
                            IconComponent = SettingsIcon;
                            break;
                    }

                    const color = isFocused ? theme.colors.accent : '#666';

                    return (
                        <TouchableOpacity
                            key={index}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabItem}
                            activeOpacity={0.8}
                        >
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 60,
                                width: 50,
                                transform: isCenter ? [{ translateY: -0 }] : []
                            }}>
                                {/* Less flashy center button: Just the SVG itself, larger. No extra gold block. */}
                                <IconComponent
                                    size={isCenter ? 58 : 24}
                                    color={isCenter ? theme.colors.accent : color}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export default React.memo(PremiumTabBar);

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
        elevation: 10,
    },
    barBackground: {
        position: 'absolute',
        top: 0, // Align with top of content
        height: 60,
        borderRadius: 30, // Fully rounded pill shape
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        backgroundColor: 'transparent',
    },
    content: {
        flexDirection: 'row',
        height: 60,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 15,
        justifyContent: 'space-between'
    },
    tabItem: {
        flex: 1,
        height: 60, // Ensure tap area fills the bar
        justifyContent: 'center',
        alignItems: 'center',
    }
});
