import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../auth/authSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ManagerCustomDrawerContent(props) {
    const navigate = useNavigation();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const { user } = useSelector(state => state.auth);
    const profile = user?.user?.employee || user?.user || {};
    const name = profile.name || 'Admin User';
    const initials = name && typeof name === 'string' ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

    return (
        <DrawerContentScrollView {...props} style={styles.container} contentContainerStyle={{ paddingTop: 0 }}>
            <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
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
                    <View style={styles.avatarWrapper}>
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
                        <View style={styles.activeIndicator} />
                    </View>

                    <View style={styles.profileTextContainer}>
                        <Text style={styles.username} numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={styles.designation} numberOfLines={1}>
                            {profile.designation || 'Internal Staff'}
                        </Text>
                        
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
                                <Text style={styles.badgeText}>{user?.user?.role || 'Admin'}</Text>
                            </View>
                            {profile.employeeNumber && (
                                <View style={[styles.badge, { backgroundColor: '#F1F5F9', marginLeft: 6 }]}>
                                    <Text style={[styles.badgeText, { color: '#475569' }]}>#{profile.employeeNumber}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                </TouchableOpacity>
            </View>

            <View style={styles.drawerItemsContainer}>
                <DrawerItemList {...props} />
            </View>

            <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => dispatch(logout())}
            >
                <Ionicons name="log-out-outline" size={24} color="#F87171" />
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
        paddingBottom: 25,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    avatarWrapper: {
        position: 'relative',
    },
    profilePic: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    initialsContainer: {
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    profileTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    designation: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 8,
        fontWeight: '500',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    drawerItemsContainer: {
        paddingTop: 15,
        paddingHorizontal: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 40,
        backgroundColor: '#FFF1F2',
        borderRadius: 12,
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
