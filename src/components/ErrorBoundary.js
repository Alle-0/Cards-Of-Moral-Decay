import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Qualcosa è andato storto!</Text>
                    <Text style={styles.error}>{this.state.error?.toString()}</Text>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20
    },
    title: {
        color: '#ff6b6b',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20
    },
    error: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center'
    }
});

export default ErrorBoundary;
