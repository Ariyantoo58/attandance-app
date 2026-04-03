import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EmployeeDetails = ({ route }) => {
    const { employee } = route.params;
    const navigation = useNavigation();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <AntDesign name="left" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Employee Details</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.navigate("EmployeeEdit", { employee })}
                    style={styles.editButton}
                >
                    <AntDesign name="edit" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>
            
            {employee.avatarUrl ? (
                <Image source={{ uri: employee.avatarUrl }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.initialsContainer]}>
                    <Text style={styles.initialsText}>
                        {employee.name ? employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?'}
                    </Text>
                </View>
            )}
            <Text style={styles.name}>{employee.name}</Text>
            <Text style={styles.designation}>{employee.designation || employee.position?.title || 'No Position'}</Text>
            <View style={styles.detailsContainer}>
                <Text style={styles.detail}><Text style={styles.label}>Employee No:</Text> {employee.employeeNumber || '-'}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Gender:</Text> {employee.gender || '-'}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Date of Birth:</Text> {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '-'}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Join Date:</Text> {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : '-'}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Department:</Text> {employee.department?.name || '-'}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Mobile No:</Text> {employee.phoneNumber || '-'}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Address:</Text> {employee.address || '-'}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Salary:</Text> {employee.salary ? `$ ${employee.salary}` : '-'}</Text>
                
                <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Academic & Experience</Text>
                    <Text style={styles.detail}><Text style={styles.label}>Study:</Text> {employee.study || '-'}</Text>
                    <Text style={styles.detail}><Text style={styles.label}>Experience:</Text> {employee.experience || '-'}</Text>
                    <Text style={styles.detail}><Text style={styles.label}>Achievement:</Text> {employee.achievement || '-'}</Text>
                    <Text style={styles.detail}><Text style={styles.label}>10th Marks:</Text> {employee.marks10 || '-'}</Text>
                    <Text style={styles.detail}><Text style={styles.label}>12th Marks:</Text> {employee.marks12 || '-'}</Text>
                    <Text style={styles.detail}><Text style={styles.label}>Graduation:</Text> {employee.graduationMarks || '-'}</Text>
                </View>
            </View>
        </ScrollView>
    </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
        padding: 5,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignSelf: 'center',
        marginBottom: 20,
    },
    initialsContainer: {
        backgroundColor: '#4F8EF7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    designation: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    detailsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    detail: {
        fontSize: 16,
        marginBottom: 10,
    },
    label: {
        fontWeight: 'bold',
    },
});

export default EmployeeDetails;
