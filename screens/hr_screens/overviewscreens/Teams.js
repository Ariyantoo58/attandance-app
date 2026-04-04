import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';

// Placeholder images (replace with actual image paths)
const placeholderImage = 'https://www.nordstudio.ch/wp/wp-content/uploads/2018/02/mitarbeiter-business-fotos_06.jpg';

const Teams = () => {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const data = await apiService.getAllEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };


    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.teamItem} onPress={() => setSelectedTeam(item)}>
            <View style={styles.initialCircle}>
                <Text style={styles.initialText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.teamDetails}>
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.teamLeader}>Role: {item.role || 'Employee'}</Text>
                <View className="flex-row items-center space-x-5">
                    <Text style={styles.teamPoints}>Email: {item.email || 'N/A'}</Text>
                </View>
            </View>
            <AntDesign name="right" size={18} color="black" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#6200EE" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Employees List</Text>
            <FlatList
                data={employees}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
            />
            {selectedTeam && (
                <EmployeeModal employee={selectedTeam} visible={selectedTeam !== null} onClose={() => setSelectedTeam(null)} />
            )}
        </View>
    );
};

const EmployeeModal = ({ employee, visible, onClose }) => (
    <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={onClose}
    >
        <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>Employee Info</Text>
            <View style={styles.memberItem}>
                <Image source={{ uri: placeholderImage }} style={styles.memberImage} />
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{employee.name}</Text>
                    <Text style={styles.memberDesignation}>{employee.role || 'Employee'}</Text>
                    <Text style={styles.memberPoints}>Email: {employee.email || 'N/A'}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    teamItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 10,
        marginBottom: 10,
    },
    initialCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6200EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    initialText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    teamDetails: {
        flex: 1,
    },
    teamName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    teamLeader: {
        fontSize: 14,
        color: '#666',
    },
    teamPoints: {
        fontSize: 14,
        color: '#666',
    },
    memberCount: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    memberCountText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    modalHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 10,
    },
    memberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    memberDesignation: {
        fontSize: 16,
        color: '#666',
    },
    memberPoints: {
        fontSize: 16,
        color: '#666',
    },
    closeButton: {
        backgroundColor: '#6200EE',
        paddingVertical: 15,
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 20,
        marginTop: 0,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default Teams;
