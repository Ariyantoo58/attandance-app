import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { apiService } from '../../../services/api';

const TaskCreation = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const initialEmployeeId = route.params?.initialEmployeeId;

    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(initialEmployeeId ? [initialEmployeeId] : []);
    const [employees, setEmployees] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [category, setCategory] = useState('GENERAL');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingEmployees, setFetchingEmployees] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
    const [isPickerModalVisible, setPickerModalVisible] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await apiService.getAllEmployees();
                setEmployees(data);
            } catch (error) {
                console.error('Failed to fetch employees:', error);
            } finally {
                setFetchingEmployees(false);
            }
        };
        fetchEmployees();
    }, []);

    const toggleEmployee = (id) => {
        if (selectedEmployeeIds.includes(id)) {
            setSelectedEmployeeIds(selectedEmployeeIds.filter(item => item !== id));
        } else {
            setSelectedEmployeeIds([...selectedEmployeeIds, id]);
        }
    };

    const handleSend = async () => {
        if (selectedEmployeeIds.length === 0 || !title) {
            Alert.alert("Error", "Please select at least one employee and enter a title.");
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                employeeIds: selectedEmployeeIds,
                title,
                description,
                date: startDate,
                dueDate: dueDate || null,
                priority,
                category
            };

            await apiService.assignTask(requestData);
            Alert.alert("Success", "Tasks assigned successfully!");
            navigation.goBack();
        } catch (error) {
            console.error('Failed to assign task:', error);
            Alert.alert("Error", "Failed to assign task. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getSelectedNames = () => {
        return employees
            .filter(emp => selectedEmployeeIds.includes(emp.id))
            .map(emp => emp.name)
            .join(', ');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <AntDesign name="left" size={20} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {initialEmployeeId ? "Self Task" : "Assign Multi-Task"}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    {!initialEmployeeId && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Assign to Employees</Text>
                            <TouchableOpacity 
                                style={[styles.pickerContainer, { padding: 12, minHeight: 48, justifyContent: 'center' }]}
                                onPress={() => setPickerModalVisible(true)}
                            >
                                <Text style={{ color: selectedEmployeeIds.length > 0 ? '#1E293B' : '#94A3B8' }} numberOfLines={1}>
                                    {selectedEmployeeIds.length > 0 ? getSelectedNames() : 'Select one or more people...'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color="#64748B" style={{ position: 'absolute', right: 12 }} />
                            </TouchableOpacity>
                            {selectedEmployeeIds.length > 0 && (
                                <Text style={styles.selectedCount}>{selectedEmployeeIds.length} person(s) selected</Text>
                            )}
                        </View>
                    )}
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Task Title</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Type here..."
                            style={styles.textInput}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.pickerContainer}>
                                <RNPickerSelect
                                    onValueChange={(value) => setCategory(value)}
                                    value={category}
                                    items={[
                                        { label: 'General', value: 'GENERAL' },
                                        { label: 'Dev', value: 'DEVELOPMENT' },
                                        { label: 'Design', value: 'DESIGN' },
                                        { label: 'Marketing', value: 'MARKETING' },
                                    ]}
                                    style={pickerSelectStyles}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => <Ionicons name="chevron-down" size={16} color="#94A3B8" style={{ marginTop: Platform.OS === 'ios' ? 12 : 10, marginRight: 10 }} />}
                                />
                            </View>
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.label}>Priority</Text>
                            <View style={styles.pickerContainer}>
                                <RNPickerSelect
                                    onValueChange={(value) => setPriority(value)}
                                    value={priority}
                                    items={[
                                        { label: 'Low', value: 'LOW' },
                                        { label: 'Medium', value: 'MEDIUM' },
                                        { label: 'High', value: 'HIGH' },
                                    ]}
                                    style={pickerSelectStyles}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => <Ionicons name="chevron-down" size={16} color="#94A3B8" style={{ marginTop: Platform.OS === 'ios' ? 12 : 10, marginRight: 10 }} />}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Details about the task..."
                            style={[styles.textInput, styles.textArea]}
                        />
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.datesRow}>
                        <View style={styles.dateCol}>
                            <Text style={styles.label}>Start Date</Text>
                            <TouchableOpacity 
                                onPress={() => setShowDatePicker(true)} 
                                style={styles.datePickerButton}
                            >
                                <Ionicons name="calendar-outline" size={18} color="#00a2e4" />
                                <Text style={styles.dateText}>{startDate}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.dateCol}>
                            <Text style={styles.label}>Due Date</Text>
                            <TouchableOpacity 
                                onPress={() => setShowDueDatePicker(true)} 
                                style={styles.datePickerButton}
                            >
                                <Ionicons name="time-outline" size={18} color="#F75353" />
                                <Text style={styles.dateText}>{dueDate || 'Open'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* START DATE PICKER */}
                {Platform.OS === 'ios' ? (
                    <Modal
                        visible={showDatePicker}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <TouchableOpacity 
                            style={styles.modalOverlay} 
                            activeOpacity={1} 
                            onPress={() => setShowDatePicker(false)}
                        >
                            <View style={styles.datePickerModalContent}>
                                <View style={styles.datePickerHeader}>
                                    <Text style={styles.datePickerTitle}>Start Date</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.datePickerDoneText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={startDate ? new Date(startDate) : new Date()}
                                    mode="date"
                                    display="inline"
                                    onChange={(event, date) => {
                                        if (date) {
                                            // Using YYYY-MM-DD local format to avoid TZ issues
                                            const year = date.getFullYear();
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const day = String(date.getDate()).padStart(2, '0');
                                            setStartDate(`${year}-${month}-${day}`);
                                        }
                                    }}
                                    themeVariant="light"
                                />
                            </View>
                        </TouchableOpacity>
                    </Modal>
                ) : (
                    showDatePicker && (
                        <DateTimePicker
                            value={startDate ? new Date(startDate) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    setStartDate(`${year}-${month}-${day}`);
                                }
                            }}
                        />
                    )
                )}

                {/* DUE DATE PICKER */}
                {Platform.OS === 'ios' ? (
                    <Modal
                        visible={showDueDatePicker}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowDueDatePicker(false)}
                    >
                        <TouchableOpacity 
                            style={styles.modalOverlay} 
                            activeOpacity={1} 
                            onPress={() => setShowDueDatePicker(false)}
                        >
                            <View style={styles.datePickerModalContent}>
                                <View style={styles.datePickerHeader}>
                                    <Text style={styles.datePickerTitle}>Due Date</Text>
                                    <TouchableOpacity onPress={() => setShowDueDatePicker(false)}>
                                        <Text style={styles.datePickerDoneText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={dueDate ? new Date(dueDate) : new Date()}
                                    mode="date"
                                    display="inline"
                                    onChange={(event, date) => {
                                        if (date) {
                                            const year = date.getFullYear();
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const day = String(date.getDate()).padStart(2, '0');
                                            setDueDate(`${year}-${month}-${day}`);
                                        }
                                    }}
                                    themeVariant="light"
                                />
                            </View>
                        </TouchableOpacity>
                    </Modal>
                ) : (
                    showDueDatePicker && (
                        <DateTimePicker
                            value={dueDate ? new Date(dueDate) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowDueDatePicker(false);
                                if (date) {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    setDueDate(`${year}-${month}-${day}`);
                                }
                            }}
                        />
                    )
                )}

                <TouchableOpacity 
                    onPress={handleSend} 
                    disabled={loading} 
                    style={[styles.submitButton, loading && { opacity: 0.7 }]}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {initialEmployeeId ? "Submit Personal Task" : `Assign to ${selectedEmployeeIds.length} People`}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Multiple Employee Picker Modal */}
            <Modal
                visible={isPickerModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setPickerModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Employees</Text>
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
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionHeader: {
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        overflow: 'hidden',
    },
    selectedCount: {
        fontSize: 12,
        color: '#00a2e4',
        marginTop: 4,
        fontWeight: '600',
    },
    datesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateCol: {
        width: '48%',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    dateText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#00a2e4',
        height: 54,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
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
    // Date Picker Modal Styles
    datePickerModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    datePickerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
    },
    datePickerDoneText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#00a2e4',
    },
});

const pickerSelectStyles = {
    inputIOS: {
        fontSize: 15,
        paddingVertical: 12,
        paddingHorizontal: 12,
        color: '#1E293B',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 15,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#1E293B',
        paddingRight: 30,
    },
};

export default TaskCreation;
