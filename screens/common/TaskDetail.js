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
    const isAdmin = userState?.role === 'ADMIN' || userState?.role === 'HR';

    const [progress, setProgress] = useState(task.progress || 0);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [priority, setPriority] = useState(task.priority || 'MEDIUM');
    const [category, setCategory] = useState(task.category || 'GENERAL');
    
    // Multi-Select People
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([task.employeeId]);
    const [employees, setEmployees] = useState([]);
    const [isPickerModalVisible, setPickerModalVisible] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            fetchEmployees();
        }
    }, [isAdmin]);

    const fetchEmployees = async () => {
        try {
            const data = await apiService.getAllEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
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
            await apiService.updateTaskProgress(task.id, progress);
            Alert.alert("Success", "Progress updated successfully!");
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update progress.");
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
            // Logic: 
            // 1. Update the CURRENT task with the FIRST selected employee
            // 2. If there are MORE people selected, CREATE NEW tasks for them (cloning)
            
            const firstId = selectedEmployeeIds[0];
            const otherIds = selectedEmployeeIds.slice(1);

            // Update main task
            await apiService.updateTask(task.id, { 
                title, 
                description,
                progress,
                priority,
                category,
                employeeId: firstId,
                status: progress === 100 ? 'COMPLETE' : (progress > 0 ? 'IN_PROGRESS' : 'PENDING')
            });

            // If multi-assignment during edit
            if (otherIds.length > 0) {
                await apiService.assignTask({
                    employeeIds: otherIds,
                    title,
                    description,
                    priority,
                    category,
                    date: task.date, // Preserve original date
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
                    {isAdmin && (
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
                            <Feather name={isEditing ? "x" : "edit-2"} size={20} color={isEditing ? "red" : "black"} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>{task.status}</Text>
                    </View>

                    {isEditing ? (
                        <View style={styles.form}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput 
                                style={styles.input} 
                                value={title} 
                                onChangeText={setTitle} 
                                placeholder="Task Title"
                            />
                            
                            <Text style={styles.label}>Assign To (Multiple allowed)</Text>
                            <TouchableOpacity 
                                style={styles.pickerWrapper} 
                                onPress={() => setPickerModalVisible(true)}
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

                            <Text style={styles.label}>Description</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea]} 
                                multiline 
                                value={description} 
                                onChangeText={setDescription} 
                                placeholder="Task Description"
                            />
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
                                <Ionicons name="person-outline" size={20} color="#666" />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.infoLabel}>Current Assignee</Text>
                                    <Text style={[styles.infoValue, { color: '#4A90E2' }]}>
                                        {task.employee?.name || 'Unassigned'}
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
                            <Text style={styles.saveButtonText}>{isEditing ? (selectedEmployeeIds.length > 1 ? `Update & Clone to ${selectedEmployeeIds.length-1} more` : "Confirm Changes") : "Update Status"}</Text>
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
                            <Text style={styles.modalTitle}>Multi Assign</Text>
                            <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                                <Ionicons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={employees}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[
                                        styles.employeeItem,
                                        selectedEmployeeIds.includes(item.id) && styles.employeeItemSelected
                                    ]}
                                    onPress={() => toggleEmployee(item.id)}
                                >
                                    <Text style={[
                                        styles.employeeName,
                                        selectedEmployeeIds.includes(item.id) && styles.employeeNameSelected
                                    ]}>{item.name}</Text>
                                    {selectedEmployeeIds.includes(item.id) && (
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
