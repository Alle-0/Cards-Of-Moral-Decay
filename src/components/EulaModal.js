import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import PremiumModal from './PremiumModal';
import PremiumButton from './PremiumButton';
import { useLanguage } from '../context/LanguageContext';

const EulaModal = ({ visible, onAccept }) => {
    const { t } = useLanguage();

    return (
        <PremiumModal
            visible={visible}
            title={t('eula_title', { defaultValue: 'Termini e Condizioni' })}
            showClose={false}
            modalHeight="80%"
        >
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
                    <Text style={styles.sectionTitle}>{t('eula_header_1', { defaultValue: '1. Comportamento dell\'Utente' })}</Text>
                    <Text style={styles.text}>
                        {t('eula_body_1', { defaultValue: 'Partecipando a Cards of Moral Decay, accetti di mantenere un comportamento rispettoso. È severamente vietato l\'uso di un linguaggio d\'odio, molestie o contenuti espliciti nei nomi utente e nelle chat.' })}
                    </Text>

                    <Text style={styles.sectionTitle}>{t('eula_header_2', { defaultValue: '2. Moderazione dei Contenuti' })}</Text>
                    <Text style={styles.text}>
                        {t('eula_body_2', { defaultValue: 'Questo gioco è basato sull\'ironia e può contenere temi forti. Tuttavia, non tolleriamo abusi. Gli utenti possono segnalare comportamenti scorretti in qualsiasi momento tramite l\'apposito tasto.' })}
                    </Text>

                    <Text style={styles.sectionTitle}>{t('eula_header_3', { defaultValue: '3. Responsabilità' })}</Text>
                    <Text style={styles.text}>
                        {t('eula_body_3', { defaultValue: 'Accettando, confermi di avere almeno 17 anni e di essere consapevole che il gioco è pensato per un pubblico adulto. Lo sviluppatore non è responsabile per i contenuti generati dagli utenti.' })}
                    </Text>

                    <View style={{ height: 20 }} />
                </ScrollView>

                <View style={styles.footer}>
                    <PremiumButton
                        title={t('eula_accept_btn', { defaultValue: 'Accetto e Procedo' })}
                        onPress={onAccept}
                        variant="primary"
                        style={{ width: '100%' }}
                    />
                </View>
            </View>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: 'Cinzel-Bold',
        color: '#FFD700',
        fontSize: 16,
        marginTop: 15,
        marginBottom: 8,
    },
    text: {
        fontFamily: 'Outfit',
        color: '#ccc',
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    }
});

export default EulaModal;
