import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { AntDesign, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { apiService } from '../../services/api';
import { useSelector } from 'react-redux';
import RNPickerSelect from 'react-native-picker-select';
import moment from 'moment';

const TaskDetail = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { task } = route.params;

    const userState = useSelector(state => state.auth.user?.user);
    const isAdmin = ['ADMIN', 'HR', 'MANAGER'].includes(userState?.role?.toUpperCase());

    const [progress, setProgress] = useState(task.progress || 0);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [priority, setPriority] = useState(task.priority || 'MEDIUM');
    const [category, setCategory] = useState(task.category || 'GENERAL');
    const [status, setStatus] = useState(task.status || 'PENDING');
    
    // Multi-Select People
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(task.employeeId ? [task.employeeId] : []);
    const [selectedTeamId, setSelectedTeamId] = useState(task.teamId);
    const [assignType, setAssignType] = useState(task.teamId ? 'TEAM' : 'INDIVIDUAL');
    
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [isPickerModalVisible, setPickerModalVisible] = useState(false);
    const [pickerType, setPickerType] = useState('emp'); // 'emp' or 'team'

    useEffect(() => {
        if (isAdmin) {
            fetchAssignmentData();
        }
    }, [isAdmin]);

    const fetchAssignmentData = async () => {
        try {
            const [empData, teamData] = await Promise.all([
                apiService.getAllEmployees(),
                apiService.getTeams()
            ]);
            setEmployees(empData);
            setTeams(teamData);
        } catch (error) {
            console.error('Failed to fetch assignment data:', error);
        }
    };

    const toggleEmployee = (id) => {
        if (selectedEmployeeIds.includes(id)) {
            // Keep at least one
            if (selectedEmployeeIds.length > 1) {
                setSelectedEmployeeIds(selectedEmployeeIds.filter(item => item !== id));
            } else {
                Alert.alert("Notice", "Task must have at least one assignee.");
            }
        } else {
            setSelectedEmployeeIds([...selectedEmployeeIds, id]);
        }
    };

    const handleUpdateProgress = async () => {
        setLoading(true);
        try {
            // If user (admin or employee) updates progress via slider, 
            // we use the updateTask endpoint to be sure status is also synced if needed.
            let updatedStatus = status;
            if (progress === 100) updatedStatus = 'COMPLETE';
            else if (progress > 0) updatedStatus = 'IN_PROGRESS';
            else if (progress === 0) updatedStatus = 'PENDING';

            await apiService.updateTask(task.id, { 
                progress,
                status: updatedStatus
            });
            Alert.alert("Success", "Task updated successfully!");
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update task.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTask = async () => {
        if (selectedEmployeeIds.length === 0) {
            Alert.alert("Error", "Please select at least one assignee.");
            return;
        }

        setLoading(true);
        try {
            const updatePayload = { 
                title, 
                description,
                progress,
                priority,
                category,
                status: status 
            };

            if (assignType === 'TEAM') {
                updatePayload.teamId = selectedTeamId;
                updatePayload.employeeId = null; // Important: clear employeeId in backend-ready format
            } else {
                updatePayload.employeeId = selectedEmployeeIds[0];
                updatePayload.teamId = null;
            }

            // Update main task
            await apiService.updateTask(task.id, updatePayload);

            // If multi-assignment during edit (only for INDIVIDUAL)
            if (assignType === 'INDIVIDUAL' && selectedEmployeeIds.length > 1) {
                const otherIds = selectedEmployeeIds.slice(1);
                await apiService.assignTask({
                    employeeIds: otherIds,
                    title,
                    description,
                    priority,
                    category,
                    date: task.date, 
                    dueDate: task.dueDate
                });
            }

            Alert.alert("Success", "Task and additional assignments updated!");
            setIsEditing(false);
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update task/assignments.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return '#F5A623';
            case 'IN_PROGRESS': return '#4A90E2';
            case 'COMPLETE': return '#7ED321';
            default: return '#9B9B9B';
        }
    };

    const getSelectedNames = () => {
        if (assignType === 'TEAM') {
            return teams.find(t => t.id === selectedTeamId)?.name || 'Select team...';
        }
        return employees
            .filter(emp => selectedEmployeeIds.includes(emp.id))
            .map(emp => emp.name)
            .join(', ');
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <AntDesign name="left" size={20} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Task Details</Text>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
                        <Feather name={isEditing ? "x" : (isAdmin ? "edit-2" : "edit")} size={20} color={isEditing ? "red" : "black"} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>{task.status}</Text>
                    </View>

                    {isEditing ? (
                        <View style={styles.form}>
                            {isAdmin && (
                                <>
                                    <Text style={styles.label}>Title</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={title} 
                                        onChangeText={setTitle} 
                                        placeholder="Task Title"
                                    />
                                    
                                    <Text style={styles.label}>Assignment</Text>
                                    <View style={styles.tabContainer}>
                                        <TouchableOpacity 
                                            style={[styles.tab, assignType === 'INDIVIDUAL' && styles.activeTab]} 
                                            onPress={() => setAssignType('INDIVIDUAL')}
                                        >
                                            <Ionicons name="person-outline" size={16} color={assignType === 'INDIVIDUAL' ? 'white' : '#64748B'} />
                                            <Text style={[styles.tabText, assignType === 'INDIVIDUAL' && styles.activeTabText]}>Individu</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.tab, assignType === 'TEAM' && styles.activeTab]} 
                                            onPress={() => setAssignType('TEAM')}
                                        >
                                            <Ionicons name="people-outline" size={16} color={assignType === 'TEAM' ? 'white' : '#64748B'} />
                                            <Text style={[styles.tabText, assignType === 'TEAM' && styles.activeTabText]}>Tim</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {assignType === 'INDIVIDUAL' ? (
                                        <>
                                            <TouchableOpacity 
                                                style={styles.pickerWrapper} 
                                                onPress={() => {
                                                    setPickerType('emp');
                                                    setPickerModalVisible(true);
                                                }}
                                            >
                                                <View style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={{ flex: 1, color: '#374151' }} numberOfLines={1}>
                                                        {getSelectedNames() || 'Select people...'}
                                                    </Text>
                                                    <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                                                </View>
                                            </TouchableOpacity>
                                            {selectedEmployeeIds.length > 1 && (
                                                <Text style={styles.batchInfo}>Note: This will create {selectedEmployeeIds.length - 1} extra copy/copies of this task.</Text>
                                            )}
                                        </>
                                    ) : (
                                        <TouchableOpacity 
                                            style={styles.pickerWrapper} 
                                            onPress={() => {
                                                setPickerType('team');
                                                setPickerModalVisible(true);
                                            }}
                                        >
                                            <View style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{ flex: 1, color: '#374151' }} numberOfLines={1}>
                                                    {getSelectedNames() || 'Select team...'}
                                                </Text>
                                                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                                            </View>
                                        </TouchableOpacity>
                                    )}

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View style={{ width: '48%' }}>
                                            <Text style={styles.label}>Category</Text>
                                            <View style={styles.pickerWrapper}>
                                                <RNPickerSelect
                                                    onValueChange={(value) => setCategory(value)}
                                                    value={category}
                                                    items={[
                                                        { label: 'General', value: 'GENERAL' },
                                                        { label: 'Development', value: 'DEVELOPMENT' },
                                                        { label: 'Design', value: 'DESIGN' },
                                                        { label: 'Marketing', value: 'MARKETING' },
                                                    ]}
                                                    style={pickerSelectStyles}
                                                />
                                            </View>
                                        </View>
                                        <View style={{ width: '48%' }}>
                                            <Text style={styles.label}>Priority</Text>
                                            <View style={styles.pickerWrapper}>
                                                <RNPickerSelect
                                                    onValueChange={(value) => setPriority(value)}
                                                    value={priority}
                                                    items={[
                                                        { label: 'Low', value: 'LOW' },
                                                        { label: 'Medium', value: 'MEDIUM' },
                                                        { label: 'High', value: 'HIGH' },
                                                    ]}
                                                    style={pickerSelectStyles}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </>
                            )}

                            <Text style={styles.label}>Status</Text>
                            <View style={styles.pickerWrapper}>
                                <RNPickerSelect
                                    onValueChange={(value) => {
                                        setStatus(value);
                                        if (value === 'COMPLETE') setProgress(100);
                                        if (value === 'PENDING') setProgress(0);
                                    }}
                                    value={status}
                                    items={[
                                        { label: 'Pending', value: 'PENDING' },
                                        { label: 'In Progress', value: 'IN_PROGRESS' },
                                        { label: 'Complete', value: 'COMPLETE' },
                                    ]}
                                    style={pickerSelectStyles}
                                />
                            </View>

                            {isAdmin ? (
                                <>
                                    <Text style={styles.label}>Description</Text>
                                    <TextInput 
                                        style={[styles.input, styles.textArea]} 
                                        multiline 
                                        value={description} 
                                        onChangeText={setDescription} 
                                        placeholder="Task Description"
                                    />
                                </>
                            ) : (
                                <View style={{ padding: 15, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 15 }}>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 5, fontWeight: 'bold' }}>TASK INFO</Text>
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111827' }}>{title}</Text>
                                    <Text style={{ fontSize: 13, color: '#4B5563', marginTop: 5 }}>{description || "No description provided."}</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.description}>{description || "No description provided."}</Text>
                        </>
                    )}

                    {/* Task Info Grid */}
                    {!isEditing && (
                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Ionicons name={task.teamId ? "people-outline" : "person-outline"} size={20} color="#666" />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>{task.teamId ? 'Team Name' : 'Current Assignee'}</Text>
                                    <Text style={[styles.infoValue, { color: '#4A90E2' }]}>
                                        {task.teamId ? (task.team?.name || 'Loading Team...') : (task.employee?.name || 'Unassigned')}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="flag-outline" size={20} color="#666" />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>Priority</Text>
                                    <Text style={[styles.infoValue, { color: priority === 'HIGH' ? 'red' : 'black' }]}>{priority}</Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="apps-outline" size={20} color="#666" />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>Category</Text>
                                    <Text style={styles.infoValue}>{category}</Text>
                                </View>
                            </View>
                             <View style={styles.infoItem}>
                                <Ionicons name="time-outline" size={20} color="#666" />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>Due Date</Text>
                                    <Text style={styles.infoValue}>{task.dueDate ? moment(task.dueDate).format('MMM DD, YYYY') : 'None'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="stats-chart-outline" size={20} color="#666" />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>Status</Text>
                                    <Text style={[styles.infoValue, { color: getStatusColor(status) }]}>{status}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Progress Control */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressTitle}>Completion Progress</Text>
                            <Text style={styles.progressPercent}>{progress}%</Text>
                        </View>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={100}
                            step={5}
                            value={progress}
                            onValueChange={setProgress}
                            minimumTrackTintColor="#4A90E2"
                            maximumTrackTintColor="#D1D1D1"
                            thumbTintColor="#4A90E2"
                            disabled={!isAdmin && task.status === 'COMPLETE'}
                        />
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressLabel}>Started</Text>
                            <Text style={styles.progressLabel}>Finished</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity 
                        style={[styles.saveButton, loading && { opacity: 0.7 }]} 
                        onPress={isEditing ? handleUpdateTask : handleUpdateProgress}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : (
                            <Text style={styles.saveButtonText}>
                                {isEditing ? 
                                    (assignType === 'INDIVIDUAL' && selectedEmployeeIds.length > 1 ? `Update & Clone to ${selectedEmployeeIds.length-1} more` : "Confirm Changes") 
                                    : "Update Status"
                                }
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Multi Employee Modal */}
            <Modal
                visible={isPickerModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setPickerModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{pickerType === 'emp' ? 'Multi Assign' : 'Select Team'}</Text>
                            <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                                <Ionicons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={pickerType === 'emp' ? employees : teams}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[
                                        styles.employeeItem,
                                        ((pickerType === 'emp' && selectedEmployeeIds.includes(item.id)) || (pickerType === 'team' && selectedTeamId === item.id)) && styles.employeeItemSelected
                                    ]}
                                    onPress={() => {
                                        if (pickerType === 'emp') toggleEmployee(item.id);
                                        else {
                                            setSelectedTeamId(item.id);
                                            setPickerModalVisible(false);
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.employeeName,
                                        ((pickerType === 'emp' && selectedEmployeeIds.includes(item.id)) || (pickerType === 'team' && selectedTeamId === item.id)) && styles.employeeNameSelected
                                    ]}>{item.name}</Text>
                                    {((pickerType === 'emp' && selectedEmployeeIds.includes(item.id)) || (pickerType === 'team' && selectedTeamId === item.id)) && (
                                        <Ionicons name="checkmark-circle" size={20} color="#00a2e4" />
                                    )}
                                </TouchableOpacity>
                            )}
                            style={{ maxHeight: 400 }}
                        />
                        <TouchableOpacity 
                            style={styles.doneButton}
                            onPress={() => setPickerModalVisible(false)}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
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
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 15 },
    tab: { flex: 1, flexDirection: 'row', height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
    activeTab: { backgroundColor: '#2563EB', shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 5 },
    tabText: { marginLeft: 6, fontSize: 12, fontWeight: '700', color: '#64748B' },
    activeTabText: { color: 'white' },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    editButton: {
        padding: 5,
    },
    content: {
        padding: 20,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 10,
        marginBottom: 20,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 24,
        fontWeight: 'extrabold',
        color: '#111827',
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 25,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 15,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 2,
    },
    infoItem: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    infoLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#374151',
    },
    progressSection: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    progressPercent: {
        fontSize: 22,
        fontWeight: '900',
        color: '#4A90E2',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    progressLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#1E293B',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    form: {
        marginBottom: 10,
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#64748B',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        marginBottom: 15,
        fontSize: 15,
    },
    pickerWrapper: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        marginBottom: 15,
        overflow: 'hidden',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    batchInfo: {
        fontSize: 11,
        color: '#00a2e4',
        marginBottom: 15,
        marginTop: -10,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    employeeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    employeeItemSelected: {
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    employeeName: {
        fontSize: 16,
        color: '#334155',
    },
    employeeNameSelected: {
        fontWeight: 'bold',
        color: '#00a2e4',
    },
    doneButton: {
        backgroundColor: '#1E293B',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    doneButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

const pickerSelectStyles = {
    inputIOS: {
        fontSize: 15,
        paddingVertical: 14,
        paddingHorizontal: 12,
        color: '#1E293B',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 15,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: '#1E293B',
        paddingRight: 30,
    },
};

export default TaskDetail;
