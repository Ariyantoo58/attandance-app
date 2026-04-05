import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHrDashboard } from '@/auth/dataSlice';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import moment from 'moment';

const ProjectTasks = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { allTasks: storeTasks, allEmployees: storeEmployees, loading: storeLoading } = useSelector(state => state.data.hrDashboard);

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    
    // Filters State
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    
    // Advanced Filters
    const [filterAssignee, setFilterAssignee] = useState(null);
    const [filterPriority, setFilterPriority] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);
    const [filterStartDate, setFilterStartDate] = useState(null);
    const [filterEndDate, setFilterEndDate] = useState(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Sync store data to local state for filtering support
    useEffect(() => {
        if (storeEmployees) {
            setEmployees(storeEmployees.map(emp => ({ label: emp.name, value: emp.id })));
        }
    }, [storeEmployees]);

    useEffect(() => {
        // Only set tasks from store if no server filters are active
        if (!filterAssignee && !filterPriority && !filterCategory && !filterStartDate && !filterEndDate && statusFilter === 'All') {
            setTasks(storeTasks || []);
        }
    }, [storeTasks, filterAssignee, filterPriority, filterCategory, filterStartDate, filterEndDate, statusFilter]);

    // Background sync on focus
    useFocusEffect(
        React.useCallback(() => {
            dispatch(fetchHrDashboard());
        }, [dispatch])
    );

    // Filter sync (Server-side)
    useEffect(() => {
        if (filterAssignee || filterPriority || filterCategory || filterStartDate || filterEndDate || statusFilter !== 'All') {
            loadTasks();
        }
    }, [statusFilter, filterAssignee, filterPriority, filterCategory, filterStartDate, filterEndDate]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const params = {
                status: statusFilter !== 'All' ? statusFilter : undefined,
                employeeId: filterAssignee || undefined,
                priority: filterPriority || undefined,
                category: filterCategory || undefined,
                startDate: filterStartDate ? filterStartDate.toISOString() : undefined,
                endDate: filterEndDate ? filterEndDate.toISOString() : undefined,
            };
            
            const data = await apiService.getAllTasks(params);
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilterAssignee(null);
        setFilterPriority(null);
        setFilterCategory(null);
        setFilterStartDate(null);
        setFilterEndDate(null);
        setStatusFilter('All');
    };

    const getStatusInfo = (status) => {
        const s = status ? status.toUpperCase() : '';
        switch (s) {
            case 'PENDING':
                return { bg: 'bg-orange-100', text: 'text-orange-600', dot: 'bg-orange-500', name: 'Pending' };
            case 'COMPLETE':
                return { bg: 'bg-green-100', text: 'text-green-600', dot: 'bg-green-500', name: 'Complete' };
            case 'IN_PROGRESS':
            case 'INPROGRESS':
                return { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500', name: 'In Progress' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-500', name: status };
        }
    };

    return (
        <View style={styles.container} className="bg-blue-50">
            {/* Custom Header */}
            <View className="pt-12 pb-4 px-5 bg-white shadow-sm flex-row items-center justify-between border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text className="text-[18px] font-bold text-gray-800">Team Progress</Text>
                <View className="flex-row">
                    <TouchableOpacity 
                        onPress={() => setFilterModalVisible(true)}
                        className="mr-3"
                    >
                        <Ionicons name="filter" size={24} color={filterAssignee || filterPriority || filterCategory || filterStartDate ? "#00a2e4" : "#1E293B"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("TaskCreation")}>
                        <Ionicons name="add-circle-outline" size={26} color="#00a2e4" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Horizontal Status Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-4">
                    {['All', 'PENDING', 'IN_PROGRESS', 'COMPLETE'].map(status => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setStatusFilter(status)}
                            className={`mr-2 rounded-full px-3.5 py-2 ${statusFilter.toUpperCase() === status ? 'bg-blue-500' : 'bg-white border border-gray-100 shadow-sm'}`}
                        >
                            <Text className={`text-[11px] font-bold ${statusFilter.toUpperCase() === status ? 'text-white' : 'text-blue-500'}`}>
                                {status.replace('_', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Filter Summary Badge (if any) */}
                {(filterAssignee || filterPriority || filterCategory || filterStartDate) && (
                    <View className="px-5 pb-2 flex-row items-center">
                        <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Server Filters Active:</Text>
                        <TouchableOpacity onPress={resetFilters} className="ml-2 bg-blue-100 px-2 py-1 rounded">
                            <Text className="text-[10px] text-blue-600 font-bold">Reset All</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Loading Indicator for refresh */}
                {loading && (
                    <ActivityIndicator size="small" color="#00a2e4" style={{ marginVertical: 10 }} />
                )}

                {/* Task Cards */}
                <View className="px-5">
                    {tasks.length > 0 ? (
                        tasks.map((task) => {
                            const statusInfo = getStatusInfo(task.status);
                            return (
                                <TouchableOpacity 
                                    key={task.id} 
                                    onPress={() => navigation.navigate('TaskDetail', { task })}
                                    className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100"
                                >
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-[16px] font-bold text-gray-800" numberOfLines={1}>{task.title}</Text>
                                            <View className="flex-row items-center mt-1">
                                                <Ionicons name="person-outline" size={12} color="#94A3B8" />
                                                <Text className="text-[11px] text-gray-500 ml-1">
                                                    Assignee: <Text className="font-bold text-blue-500">{task.employee?.name || 'Unassigned'}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                        <View className={`px-2 py-1 rounded-md ${statusInfo.bg}`}>
                                            <Text className={`text-[10px] font-bold ${statusInfo.text}`}>{statusInfo.name}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center justify-between mt-2">
                                        <View className="flex-row">
                                            <View className="flex-row items-center mr-3">
                                                <Ionicons name="flag-outline" size={14} color={task.priority === 'HIGH' ? '#F75353' : '#3B82F6'} />
                                                <Text className={`text-[11px] ml-1 font-bold ${task.priority === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`}>{task.priority}</Text>
                                            </View>
                                            <View className="flex-row items-center">
                                                <Ionicons name="grid-outline" size={14} color="#94A3B8" />
                                                <Text className="text-[11px] ml-1 text-gray-500 font-medium">{task.category}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-lg">
                                            <Ionicons name="calendar-outline" size={14} color="#64748B" />
                                            <Text className="text-[11px] text-gray-600 font-bold ml-1">{moment(task.date).format('DD MMM')}</Text>
                                        </View>
                                    </View>

                                    {/* Mini Progress Bar */}
                                    <View className="mt-4">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="text-[10px] text-gray-400 font-bold">COMPLETION</Text>
                                            <Text className="text-[10px] text-blue-500 font-black">{task.progress}%</Text>
                                        </View>
                                        <View className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <View className="h-full bg-blue-500" style={{ width: `${task.progress}%` }} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        !loading && (
                            <View className="items-center justify-center mt-20">
                                <Ionicons name="cloud-offline-outline" size={60} color="#E2E8F0" />
                                <Text className="text-gray-400 mt-4 text-[15px] font-medium">No tasks found on server</Text>
                            </View>
                        )
                    )}
                </View>
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={isFilterModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>API Filters</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.filterLabel}>Assignee</Text>
                            <View style={styles.pickerWrapper}>
                                <RNPickerSelect
                                    onValueChange={(value) => setFilterAssignee(value)}
                                    value={filterAssignee}
                                    items={employees}
                                    placeholder={{ label: 'All Team Members', value: null }}
                                    style={pickerSelectStyles}
                                />
                            </View>

                            <View className="flex-row justify-between">
                                <View style={{ width: '48%' }}>
                                    <Text style={styles.filterLabel}>Priority</Text>
                                    <View style={styles.pickerWrapper}>
                                        <RNPickerSelect
                                            onValueChange={(value) => setFilterPriority(value)}
                                            value={filterPriority}
                                            items={[
                                                { label: 'Low', value: 'LOW' },
                                                { label: 'Medium', value: 'MEDIUM' },
                                                { label: 'High', value: 'HIGH' },
                                            ]}
                                            placeholder={{ label: 'All', value: null }}
                                            style={pickerSelectStyles}
                                        />
                                    </View>
                                </View>
                                <View style={{ width: '48%' }}>
                                    <Text style={styles.filterLabel}>Category</Text>
                                    <View style={styles.pickerWrapper}>
                                        <RNPickerSelect
                                            onValueChange={(value) => setFilterCategory(value)}
                                            value={filterCategory}
                                            items={[
                                                { label: 'General', value: 'GENERAL' },
                                                { label: 'Dev', value: 'DEVELOPMENT' },
                                                { label: 'Design', value: 'DESIGN' },
                                                { label: 'Marketing', value: 'MARKETING' },
                                            ]}
                                            placeholder={{ label: 'All', value: null }}
                                            style={pickerSelectStyles}
                                        />
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.filterLabel}>Timeline (Server Range)</Text>
                            <View className="flex-row justify-between">
                                <TouchableOpacity 
                                    onPress={() => setShowStartPicker(true)}
                                    style={styles.datePickerBtn}
                                >
                                    <Text style={styles.datePickerBtnText}>
                                        {filterStartDate ? moment(filterStartDate).format('DD MMM') : 'From'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setShowEndPicker(true)}
                                    style={styles.datePickerBtn}
                                >
                                    <Text style={styles.datePickerBtnText}>
                                        {filterEndDate ? moment(filterEndDate).format('DD MMM') : 'To'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showStartPicker && (
                                <DateTimePicker
                                    value={filterStartDate ? new Date(filterStartDate) : new Date()}
                                    mode="date"
                                    onChange={(event, date) => {
                                        setShowStartPicker(false);
                                        if (date) setFilterStartDate(date);
                                    }}
                                />
                            )}
                            {showEndPicker && (
                                <DateTimePicker
                                    value={filterEndDate ? new Date(filterEndDate) : new Date()}
                                    mode="date"
                                    onChange={(event, date) => {
                                        setShowEndPicker(false);
                                        if (date) setFilterEndDate(date);
                                    }}
                                />
                            )}

                            <TouchableOpacity 
                                onPress={resetFilters} 
                                style={styles.resetBtn}
                            >
                                <Text style={styles.resetBtnText}>Clear All Filters</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => setFilterModalVisible(false)} 
                                style={styles.applyBtn}
                            >
                                <Text style={styles.applyBtnText}>Apply & Refresh</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 25,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B'
    },
    filterLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginBottom: 8,
        marginTop: 15,
        textTransform: 'uppercase',
    },
    pickerWrapper: {
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
    },
    datePickerBtn: {
        width: '48%',
        padding: 15,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    datePickerBtnText: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: 'bold'
    },
    applyBtn: {
        backgroundColor: '#00a2e4',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 15,
    },
    applyBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resetBtn: {
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    resetBtnText: {
        color: '#94A3B8',
        fontWeight: 'bold',
        fontSize: 14,
    }
});

const pickerSelectStyles = {
    inputIOS: {
        fontSize: 14,
        paddingVertical: 14,
        paddingHorizontal: 12,
        color: '#1E293B',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#1E293B',
        paddingRight: 30,
    },
};

export default ProjectTasks;