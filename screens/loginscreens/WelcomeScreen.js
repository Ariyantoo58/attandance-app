import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome to</Text>
                    <Text style={styles.appName}>HR Management</Text>
                    <Text style={styles.subtitle}>Streamlining your workforce with ease</Text>
                </View>

                <Image
                    source={{ uri: 'https://img.freepik.com/free-vector/modern-human-resources-management-concept-illustration_114360-1492.jpg' }}
                    style={styles.image}
                    resizeMode="contain"
                />

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.employeeButton]}
                        onPress={() => navigation.navigate('EmployeeLogin')}
                    >
                        <MaterialCommunityIcons name="account-tie" size={24} color="white" />
                        <Text style={styles.buttonText}>Employee Access</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.managerButton]}
                        onPress={() => navigation.navigate('ManagerLogin')}
                    >
                        <Ionicons name="business" size={22} color="#3B82F6" />
                        <Text style={[styles.buttonText, styles.managerButtonText]}>Admin / Manager Access</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.footer}>© 2026 HR Excellence System</Text>
            <Text style={styles.footer}>Powered By Aridevs</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        color: '#4B5563',
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 10,
        textAlign: 'center',
    },
    image: {
        width: width * 0.8,
        height: width * 0.8,
        marginBottom: 50,
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 10,
    },
    employeeButton: {
        backgroundColor: '#3B82F6',
    },
    managerButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    managerButtonText: {
        color: '#3B82F6',
    },
    footer: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 20,
    }
});

export default WelcomeScreen;
