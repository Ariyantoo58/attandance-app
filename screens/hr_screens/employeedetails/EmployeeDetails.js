import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';

const EmployeeDetails = ({ route }) => {
    const { employee } = route.params;
    const navigation = useNavigation();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <AntDesign name="left" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Employee Details</Text>
            </View>
            <Image source={{ uri: employee.imageUrl }} style={styles.image} />
            <Text style={styles.name}>{employee.name}</Text>
            <Text style={styles.designation}>{employee.designation} - {employee.position}</Text>
            <View style={styles.detailsContainer}>
                <Text style={styles.detail}><Text style={styles.label}>Date of Birth:</Text> {employee.dateOfBirth}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Join Date:</Text> {employee.joinDate}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Study:</Text> {employee.study}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Experience:</Text> {employee.experience}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Achievement:</Text> {employee.achievement}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Salary:</Text> {employee.salary}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Documents:</Text> {employee.documents}</Text>
                <Text style={styles.detail}><Text style={styles.label}>10th Marks:</Text> {employee.marks10}</Text>
                <Text style={styles.detail}><Text style={styles.label}>12th Marks:</Text> {employee.marks12}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Graduation Marks:</Text> {employee.graduationMarks}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Gender:</Text> {employee.gender}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Mobile No:</Text> {employee.mobileNo}</Text>
                <Text style={styles.detail}><Text style={styles.label}>Address:</Text> {employee.address}</Text>
            </View>
        </ScrollView>
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
    image: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignSelf: 'center',
        marginBottom: 20,
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
