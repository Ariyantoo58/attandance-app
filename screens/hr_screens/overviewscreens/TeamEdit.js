import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    ActivityIndicator, 
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';

const TeamEdit = ({ route, navigation }) => {
    const { teamId } = route.params || {};
    const isEditing = !!teamId;

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [employees, setEmployees] = useState([]);
    
    // Form State
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedLeader, setSelectedLeader] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        try {
            setFetchingData(true);
            const employeeData = await apiService.getAllEmployees();
            setEmployees(employeeData);

            if (isEditing) {
                const teamData = await apiService.getTeamById(teamId);
                setTeamName(teamData.name);
                setDescription(teamData.description || '');
                setSelectedLeader({ id: teamData.leaderId, name: teamData.leader?.name });
                setSelectedMembers(teamData.members?.map(m => ({ id: m.employeeId, name: m.employee?.name })) || []);
            }
        } catch (error) {
            console.error('Error initializing team data:', error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setFetchingData(false);
        }
    };

    const handleSubmit = async () => {
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

            if (isEditing) {
                await apiService.updateTeam(teamId, payload);
                Alert.alert('Success', 'Team updated successfully');
            } else {
                await apiService.createTeam(payload);
                Alert.alert('Success', 'Team created successfully');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Error saving team:', error);
            Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} team`);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (emp) => {
        if (selectedMembers.find(m => m.id === emp.id)) {
            setSelectedMembers(selectedMembers.filter(m => m.id !== emp.id));
        } else {
            setSelectedMembers([...selectedMembers, emp]);
        }
    };

    if (fetchingData) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.fetchingText}>Preparing team form...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Team' : 'Create Team'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Team Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Creative Designers"
                                value={teamName}
                                onChangeText={setTeamName}
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="What does this team do?"
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>TEAM LEADER</Text>
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
                                    {selectedLeader?.id === emp.id && (
                                        <Ionicons name="checkmark-circle" size={14} color="white" style={{marginLeft: 4}} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>MEMBERS ({selectedMembers.length} Selected)</Text>
                        <View style={styles.selectionList}>
                            {employees.map(emp => (
                                <TouchableOpacity 
                                    key={emp.id} 
                                    style={[
                                        styles.selectionItem, 
                                        selectedMembers.find(m => m.id === emp.id) && styles.selectedMemberItem
                                    ]}
                                    onPress={() => toggleMember(emp)}
                                >
                                    <Text style={[
                                        styles.selectionText,
                                        selectedMembers.find(m => m.id === emp.id) && styles.selectedText
                                    ]}>{emp.name}</Text>
                                    {selectedMembers.find(m => m.id === emp.id) && (
                                        <Ionicons name="add-circle" size={14} color="white" style={{marginLeft: 4}} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitButtonText}>{isEditing ? 'Update Team' : 'Complete Creation'}</Text>
                        )}
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    fetchingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 28,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1.2,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    selectionList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    selectionItem: {
        backgroundColor: 'white',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        margin: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedItem: {
        backgroundColor: '#1E293B',
        borderColor: '#1E293B',
    },
    selectedMemberItem: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    selectionText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    selectedText: {
        color: 'white',
        fontWeight: '700',
    },
    submitButton: {
        backgroundColor: '#1E293B',
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        marginTop: 10,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default TeamEdit;
