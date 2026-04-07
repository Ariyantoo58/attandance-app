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
    const profile = user?.user?.employee || user?.user || {};
    const name = profile.name || 'Admin User';
    const initials = name && typeof name === 'string' ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

    return (
        <DrawerContentScrollView {...props} style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity 
                    style={styles.profileSection} 
                    onPress={() => {
                        if (profile.id) {
                            props.navigation.navigate("EmployeeDetails", { employee: profile });
                        } else {
                            props.navigation.navigate("Settings");
                        }
                    }}
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
                    <View style={styles.profileTextContainer}>
                        <Text style={styles.username}>
                            {name}
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
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        backgroundColor: '#EFF6FF',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 40,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profilePic: {
        width: 64,
        height: 64,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    initialsContainer: {
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    profileTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#3B82F6',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    drawerItemsContainer: {
        paddingTop: 20,
        paddingHorizontal: 10,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 30,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
    },
    logoutText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#EF4444',
        fontWeight: '700',
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    drawerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
});

export default ManagerCustomDrawerContent;
