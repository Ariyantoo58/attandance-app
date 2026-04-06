import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    Modal, 
    StyleSheet, 
    ActivityIndicator, 
    TextInput,
    ScrollView,
    Alert
} from 'react-native';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';

const Teams = ({ navigation }) => {
    const { user } = useSelector(state => state.auth);
    const currentUser = user?.user || user;
    const isManager = ['HR', 'ADMIN', 'MANAGER'].includes(currentUser?.role);

    const [teams, setTeams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    
    // New Team State
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedLeader, setSelectedLeader] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        fetchTeams();
        fetchEmployees();
    }, []);

    const fetchTeams = async () => {
        try {
            const data = await apiService.getTeams();
            setTeams(data);
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const data = await apiService.getAllEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleCreateTeam = async () => {
        if (!teamName || !selectedLeader) {
            Alert.alert('Error', 'Please provide a team name and select a leader');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name: teamName,
                description,
                leaderId: selectedLeader.id,
                memberIds: selectedMembers.map(m => m.id),
            };
            await apiService.createTeam(payload);
            setCreateModalVisible(false);
            resetForm();
            fetchTeams();
        } catch (error) {
            console.error('Error creating team:', error);
            Alert.alert('Error', 'Failed to create team');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTeamName('');
        setDescription('');
        setSelectedLeader(null);
        setSelectedMembers([]);
    };

    const toggleMember = (emp) => {
        if (selectedMembers.find(m => m.id === emp.id)) {
            setSelectedMembers(selectedMembers.filter(m => m.id !== emp.id));
        } else {
            setSelectedMembers([...selectedMembers, emp]);
        }
    };

    const renderTeamCard = ({ item, index }) => {
        const colors = ['#4A90E2', '#6200EE', '#00BFA5', '#FF7043', '#EC407A', '#7E57C2'];
        const bgColor = colors[index % colors.length];

        return (
            <TouchableOpacity 
                style={styles.teamCard} 
                onPress={() => navigation.navigate('TeamDetail', { teamId: item.id })}
            >
                <View style={[styles.teamHeader, { backgroundColor: bgColor }]}>
                    <MaterialCommunityIcons name="account-group" size={24} color="white" />
                    <Text style={styles.memberCountBadge}>{item._count?.members || 0} Members</Text>
                </View>
                <View style={styles.teamBody}>
                    <Text style={styles.teamCardName}>{item.name}</Text>
                    <View style={styles.leaderRow}>
                        <Ionicons name="person-circle-outline" size={16} color="#718096" />
                        <Text style={styles.leaderNameLabel}>Lead: {item.leader?.name}</Text>
                    </View>
                    
                    <View style={styles.avatarStack}>
                        {item.members?.slice(0, 4).map((member, i) => (
                            <View key={member.employeeId} style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i }]}>
                                <Text style={styles.miniAvatarText}>{member.employee.name.charAt(0)}</Text>
                            </View>
                        ))}
                        {item.members?.length > 4 && (
                            <View style={[styles.miniAvatar, styles.moreAvatar]}>
                                <Text style={styles.miniAvatarText}>+{item.members.length - 4}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && teams.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Teams</Text>
                {isManager && (
                    <TouchableOpacity 
                        style={styles.addBtn} 
                        onPress={() => setCreateModalVisible(true)}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={teams}
                renderItem={renderTeamCard}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="account-group-outline" size={60} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No teams found</Text>
                        {isManager && (
                           <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setCreateModalVisible(true)}>
                               <Text style={styles.emptyCreateText}>Create First Team</Text>
                           </TouchableOpacity>
                        )}
                    </View>
                }
            />

            {/* Create Team Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Team</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4A5568" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>TEAM NAME</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Sales Alpha"
                                    value={teamName}
                                    onChangeText={setTeamName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Brief description of the team..."
                                    multiline
                                    numberOfLines={3}
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>SELECT TEAM LEADER</Text>
                                <View style={styles.selectionList}>
                                    {employees.map(emp => (
                                        <TouchableOpacity 
                                            key={emp.id} 
                                            style={[
                                                styles.selectionItem, 
                                                selectedLeader?.id === emp.id && styles.selectedItem
                                            ]}
                                            onPress={() => setSelectedLeader(emp)}
                                        >
                                            <Text style={[
                                                styles.selectionText,
                                                selectedLeader?.id === emp.id && styles.selectedText
                                            ]}>{emp.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>MEMBERS</Text>
                                <View style={styles.selectionList}>
                                    {employees.map(emp => (
                                        <TouchableOpacity 
                                            key={emp.id} 
                                            style={[
                                                styles.selectionItem, 
                                                selectedMembers.find(m => m.id === emp.id) && styles.selectedItem
                                            ]}
                                            onPress={() => toggleMember(emp)}
                                        >
                                            <Text style={[
                                                styles.selectionText,
                                                selectedMembers.find(m => m.id === emp.id) && styles.selectedText
                                            ]}>{emp.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.submitButton} onPress={handleCreateTeam}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Create Team</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        paddingTop: 50,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3748',
    },
    addBtn: {
        backgroundColor: '#1E293B',
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    teamCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    teamHeader: {
        height: 60,
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberCountBadge: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    teamBody: {
        padding: 15,
    },
    teamCardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 4,
    },
    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    leaderNameLabel: {
        fontSize: 12,
        color: '#718096',
        marginLeft: 4,
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E2E8F0',
        borderWidth: 2,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniAvatarText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#4A5568',
    },
    moreAvatar: {
        backgroundColor: '#CBD5E0',
        marginLeft: -10,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#A0AEC0',
        marginTop: 10,
    },
    emptyCreateBtn: {
        marginTop: 20,
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    emptyCreateText: {
        color: 'white',
        fontWeight: '700',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2D3748',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#A0AEC0',
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 15,
        fontSize: 14,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    selectionList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    selectionItem: {
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    selectedItem: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    selectionText: {
        fontSize: 12,
        color: '#4A5568',
    },
    selectedText: {
        color: 'white',
        fontWeight: '700',
    },
    submitButton: { 
        backgroundColor: '#1E293B', 
        height: 60, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 20, 
        shadowColor: '#000', 
        shadowOpacity: 0.2, 
        shadowRadius: 15, 
        elevation: 8 
    },
    submitButtonText: { 
        color: 'white', 
        fontSize: 16, 
        fontWeight: '900', 
        letterSpacing: 1 
    },
});

export default Teams;
