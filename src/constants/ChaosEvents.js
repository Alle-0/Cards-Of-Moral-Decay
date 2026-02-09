export const CHAOS_EVENTS = {
    INFLATION: 'INFLATION',
    BLACKOUT: 'BLACKOUT',
    DICTATORSHIP: 'DICTATORSHIP',
    IDENTITY_SWAP: 'IDENTITY_SWAP',
    ROBIN_HOOD: 'ROBIN_HOOD',
    DIRTY_WIN: 'DIRTY_WIN'
};

export const CHAOS_EVENT_DETAILS = {
    [CHAOS_EVENTS.INFLATION]: {
        id: CHAOS_EVENTS.INFLATION,
        titleKey: 'chaos_event_inflation_title',
        descKey: 'chaos_event_inflation_desc',
        icon: 'DirtyCashIcon',
        color: '#10b981'
    },
    [CHAOS_EVENTS.BLACKOUT]: {
        id: CHAOS_EVENTS.BLACKOUT,
        titleKey: 'chaos_event_blackout_title',
        descKey: 'chaos_event_blackout_desc',
        icon: 'EyeOffIcon',
        color: '#ef4444'
    },
    [CHAOS_EVENTS.DICTATORSHIP]: {
        id: CHAOS_EVENTS.DICTATORSHIP,
        titleKey: 'chaos_event_dictatorship_title',
        descKey: 'chaos_event_dictatorship_desc',
        icon: 'CrownIcon',
        color: '#8b5cf6'
    },
    [CHAOS_EVENTS.IDENTITY_SWAP]: {
        id: CHAOS_EVENTS.IDENTITY_SWAP,
        titleKey: 'chaos_event_identity_swap_title',
        descKey: 'chaos_event_identity_swap_desc',
        icon: 'DiceIcon', // Represents randomness/shuffle
        color: '#f59e0b'
    },
    [CHAOS_EVENTS.ROBIN_HOOD]: {
        id: CHAOS_EVENTS.ROBIN_HOOD,
        titleKey: 'chaos_event_robin_hood_title',
        descKey: 'chaos_event_robin_hood_desc',
        icon: 'CrownIcon', // Recycling Crown or use another if available
        color: '#10b981' // Green
    },
    [CHAOS_EVENTS.DIRTY_WIN]: {
        id: CHAOS_EVENTS.DIRTY_WIN,
        titleKey: 'chaos_event_dirty_win_title',
        descKey: 'chaos_event_dirty_win_desc',
        icon: 'DirtyCashIcon',
        color: '#000000' // Dark/Black
    }
};
