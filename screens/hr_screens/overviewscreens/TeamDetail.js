import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, SafeAreaPlatform, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';

const TeamDetail = ({ route, navigation }) => {
    const { teamId } = route.params;
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamDetail();
    }, [teamId]);

    const fetchTeamDetail = async () => {
        try {
            const data = await apiService.getTeamById(teamId);
            setTeam(data);
        } catch (error) {
            console.error('Error fetching team detail:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    if (!team) return null;

    const renderMember = ({ item }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberInfo}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item.employee.name.charAt(0)}</Text>
                </View>
                <View>
                    <Text style={styles.memberName}>{item.employee.name}</Text>
                    <Text style={styles.memberRole}>{item.employee.designation || 'Team Member'}</Text>
                </View>
            </View>
            <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#48BB78' }]} />
                <Text style={styles.statusText}>Active</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Team Detail</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <Ionicons name="settings-outline" size={24} color="#2D3748" />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <View style={styles.teamIconContainer}>
                    <MaterialCommunityIcons name="account-group" size={40} color="white" />
                </View>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamDescription}>{team.description || 'No description provided'}</Text>
                
                <View style={styles.leaderCard}>
                    <Text style={styles.sectionLabel}>TEAM LEADER</Text>
                    <View style={styles.leaderInfo}>
                        <View style={styles.leaderAvatar}>
                            <Text style={styles.leaderAvatarText}>{team.leader.name.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text style={styles.leaderName}>{team.leader.name}</Text>
                            <Text style={styles.leaderDesignation}>{team.leader.designation || 'Manager'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.membersSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Members ({team.members.length})</Text>
                </View>

                <FlatList
                    data={team.members}
                    renderItem={renderMember}
                    keyExtractor={(item) => item.employeeId}
                    contentContainerStyle={styles.memberList}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    backButton: {
        padding: 5,
    },
    settingsButton: {
        padding: 5,
    },
    heroSection: {
        backgroundColor: 'white',
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    teamIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    teamName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 5,
    },
    teamDescription: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 20,
    },
    leaderCard: {
        width: '100%',
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
        padding: 15,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4A5568',
        letterSpacing: 1,
        marginBottom: 10,
    },
    leaderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leaderAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2D3748',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    leaderAvatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    leaderName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
    },
    leaderDesignation: {
        fontSize: 12,
        color: '#718096',
    },
    membersSection: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    memberList: {
        paddingBottom: 20,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4A5568',
    },
    memberName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3748',
    },
    memberRole: {
        fontSize: 12,
        color: '#718096',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FFF4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2F855A',
    },
});

export default TeamDetail;
