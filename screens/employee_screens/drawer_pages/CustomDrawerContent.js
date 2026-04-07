import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../auth/authSlice';
import { Ionicons } from '@expo/vector-icons';

function CustomDrawerContent(props) {
    const navigate = useNavigation();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const profile = user?.user?.employee || user?.user || {};
    const name = profile.name || 'Employee';
    const initials = name && typeof name === 'string' ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

    return (
        <DrawerContentScrollView {...props}>
            <TouchableOpacity style={styles.profileContainer} className="mx-3 mb-3 bg-blue-50 rounded-lg border-gray-300" 
                onPress={() => props.navigation.navigate("ProfileDetails")}
            >
                {profile.avatarUrl ? (
                    <Image
                        source={{ uri: profile.avatarUrl }}
                        style={styles.profilePic}
                    />
                ) : (
                    <View style={[styles.profilePic, styles.initialsContainer]}>
                        <Text style={styles.initialsText}>{initials}</Text>
                    </View>
                )}
                <Text style={styles.username}>
                    {name}
                </Text>
                <Text className="text-gray-500 font-medium">
                    {user?.user?.role || 'Staff'}
                </Text>
            </TouchableOpacity>
            <DrawerItemList {...props} />
            <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => dispatch(logout())}
            >
                <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </DrawerContentScrollView>
    );
}

const styles = StyleSheet.create({
    profileContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: "center"
    },
    profilePic: {
        width: 100,
        height: 100,
        borderRadius: 60,
        marginBottom: 5,
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
    username: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    logoutText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#FF6B6B',
        fontWeight: 'bold',
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    drawerText: {
        marginLeft: 10,
        fontSize: 16,
        color: 'black',
        fontWeight: '500',
    },
});

export default CustomDrawerContent;
