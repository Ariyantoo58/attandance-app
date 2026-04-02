import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../auth/authSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function ManagerCustomDrawerContent(props) {
    const navigate = useNavigation();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    return (
        <DrawerContentScrollView {...props} style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity 
                    style={styles.profileSection} 
                    onPress={() => navigate.navigate("Setting")}
                >
                    <Image
                        source={{ uri: 'https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg' }}
                        style={styles.profilePic}
                    />
                    <View style={styles.profileTextContainer}>
                        <Text style={styles.username}>
                            {user?.user?.name || 'HR Manager'}
                        </Text>
                        <View style={styles.roleBadge}>
                            <MaterialCommunityIcons name="shield-check" size={12} color="white" />
                            <Text style={styles.roleText}>
                                {user?.user?.role || 'Admin'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.drawerItemsContainer}>
                <DrawerItemList {...props} />
            </View>

            <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => dispatch(logout())}
            >
                <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </DrawerContentScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        backgroundColor: '#2D3748', // Matching ManagerHomeScreen header
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 60,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profilePic: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#4A5568',
    },
    profileTextContainer: {
        marginLeft: 15,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A5568',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#CBD5E0',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    drawerItemsContainer: {
        paddingTop: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginTop: 40,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    logoutText: {
        marginLeft: 15,
        fontSize: 16,
        color: '#FF6B6B',
        fontWeight: '600',
    },
});

export default ManagerCustomDrawerContent;
