import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../../../services/api';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const EmployeeList = () => {
    const navigation = useNavigation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadEmployees();
        }, [])
    );

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const employees = await apiService.getAllEmployees();
            setData(employees);
        } catch (error) {
            console.error('Failed to load employees:', error);
            Alert.alert('Error', 'Failed to load employee list');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (item) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${item.name}?`,
            [
                { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                { text: 'Delete', onPress: () => deleteEmployee(item), style: 'destructive' }
            ],
            {
                cancelable: false,
                style: 'destructive',
                icon: 'trash',
                iconColor: 'red',
                titleStyle: { color: 'red' },
                messageStyle: { color: 'black' }
            }
        );
    };

    const deleteEmployee = async (itemToDelete) => {
        try {
            await apiService.removeEmployee(itemToDelete.id);
            Alert.alert("Success", "Employee removed");
            loadEmployees();
        } catch (error) {
            Alert.alert("Error", "Failed to delete employee");
        }
    };

    const renderAvatar = (item) => {
        if (item.avatarUrl) {
            return (
                <Image 
                    source={{ uri: item.avatarUrl }} 
                    style={styles.image} 
                    resizeMode="cover"
                />
            );
        }
        
        const initials = item.name 
            ? item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : '?';
            
        return (
            <View style={[styles.image, styles.initialsContainer]}>
                <Text style={styles.initialsText}>{initials}</Text>
            </View>
        );
    };

    const renderItem = ({ item }) => (
        <ScrollView>
            <View style={styles.itemContainer}>
                {renderAvatar(item)}
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.designation}>{item.designation || item.position?.title || 'No Role'} - {item.department?.name || 'All'}</Text>
                </View>
                <Menu>
                    <MenuTrigger >
                        <Ionicons name="ellipsis-horizontal" size={25} color="#333" />
                    </MenuTrigger>
                    <MenuOptions customStyles={menuStyles.options}>
                        <MenuOption onSelect={() => navigation.navigate("EmployeeEdit", { employee: item })}>
                            <View style={menuStyles.option}>
                                <Ionicons name="create-outline" size={20} color="#4F8EF7" />
                                <Text style={menuStyles.text}>Edit</Text>
                            </View>
                        </MenuOption>
                        <MenuOption onSelect={() => handleDelete(item)}>
                            <View style={menuStyles.option}>
                                <Ionicons name="trash-outline" size={20} color="#F75353" />
                                <Text style={menuStyles.text}>Delete</Text>
                            </View>
                        </MenuOption>
                        <MenuOption onSelect={() => navigation.navigate("EmployeeDetails", { employee: item })}>
                            <View style={menuStyles.option}>
                                <Ionicons name="eye-outline" size={20} color="#6C7A89" />
                                <Text style={menuStyles.text}>View Details</Text>
                            </View>
                        </MenuOption>
                    </MenuOptions>
                </Menu>
            </View>
        </ScrollView>
    );

    return (
        <View style={styles.container} className="bg-gray-700">
            <View className="flex-row items-center justify-between px-3 pb-3 pt-2">
                <TouchableOpacity 
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }} 
                    onPress={() => navigation.goBack()}
                >
                    <AntDesign name="left" size={18} color="black" />
                </TouchableOpacity>
                <Text className="text-center text-white font-semibold text-[18px]">Employees List</Text>
                <TouchableOpacity 
                    style={{ width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }} 
                    onPress={() => navigation.navigate("AddNewEmployee")}
                >
                    <Feather name="plus-circle" size={24} color="black" />
                </TouchableOpacity>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="white" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                />
            )}
        </View>
    );
};

export default EmployeeList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // marginTop: 50,
        paddingTop: 45
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginTop: 0,
        marginHorizontal: 11,
        borderRadius: 14,
        marginBottom: 10
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 10,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6'
    },
    initialsContainer: {
        backgroundColor: '#4F8EF7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    designation: {
        fontSize: 14,
        color: '#666',
    }
});

const menuStyles = {
    options: {
        padding: 5,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    text: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
};
