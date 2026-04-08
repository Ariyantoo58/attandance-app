import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../auth/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomDrawerContent(props) {
    const navigate = useNavigation();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const { user } = useSelector(state => state.auth);
    const profile = user?.user?.employee || user?.user || {};
    const name = profile.name || 'Employee';
    const initials = name && typeof name === 'string' ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

    return (
        <DrawerContentScrollView {...props} style={styles.container} contentContainerStyle={{ paddingTop: 0 }}>
            <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
                <TouchableOpacity 
                    style={styles.profileSection} 
                    onPress={() => props.navigation.navigate("ProfileDetails")}
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
                            {profile.designation || 'Company Employee'}
                        </Text>
                        
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, styles.roleBadge]}>
                                <Text style={styles.badgeText}>{user?.user?.role || 'Staff'}</Text>
                            </View>
                            {profile.employeeNumber && (
                                <View style={[styles.badge, styles.idBadge]}>
                                    <Text style={[styles.badgeText, { color: '#64748B' }]}>#{profile.employeeNumber}</Text>
                                </View>
                            )}
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
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: '#E2E8F0',
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
        backgroundColor: '#4F8EF7',
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
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
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
    roleBadge: {
        backgroundColor: '#4F8EF7',
    },
    idBadge: {
        backgroundColor: '#E2E8F0',
        marginLeft: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    drawerItemsContainer: {
        paddingTop: 15,
        paddingHorizontal: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 40,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
    },
    logoutText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#EF4444',
        fontWeight: '700',
    },
});

export default CustomDrawerContent;
