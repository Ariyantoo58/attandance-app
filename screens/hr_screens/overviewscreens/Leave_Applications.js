import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import React, { useState, useEffect } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';
import { useSocket } from '../../../context/SocketContext';

const Leave_Applications = () => {
    const navigation = useNavigation();
    const authState = useSelector(state => state.auth.user);
    const userId = authState?.id || authState?.user?.id;
    const [filter, setFilter] = useState('Waiting');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const { socket } = useSocket();

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('time_off:requested', (data) => {
                console.log('New leave request received via socket:', data);
                loadRequests();
            });

            socket.on('time_off:changed', (data) => {
                console.log('Leave request status changed via socket:', data);
                loadRequests();
            });

            return () => {
                socket.off('time_off:requested');
                socket.off('time_off:changed');
            };
        }
    }, [socket]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAllTimeOffRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load leave requests:', error);
            Alert.alert('Error', 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await apiService.updateTimeOffStatus(id, status, userId);
            Alert.alert('Success', `Request marked as ${status}`);
            loadRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const getStatusQuery = (f) => {
        if (f === 'Waiting') return 'SUBMITTED';
        if (f === 'Approved') return 'ACCEPTED';
        if (f === 'Cancelled') return 'REJECTED';
        return f;
    };

    const filteredTasks = requests.filter(task =>
        task.status === getStatusQuery(filter)
    );

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <View className="py-4 bg-gray-800 h-[150vh]">
            <View className="flex-row items-center px-3 pb-5 pt-10">
                <TouchableOpacity 
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }} 
                    onPress={() => navigation.goBack()}
                >
                    <AntDesign name="left" size={18} color="black" />
                </TouchableOpacity>
                <Text className="text-center w-[89%] text-white font-semibold text-[18px]">Leave Application</Text>
            </View>
            <ScrollView className="bg-white h-[100vh] px-3">
                <View className="flex-row items-center justify-between px-1 pt-5 pb-3">
                    {['Waiting', 'Approved', 'Cancelled'].map(status => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilter(status)}
                            className={`rounded-2xl px-7 py-1.5 ${filter === status ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                            <Text className={`${filter === status ? 'text-white' : 'text-gray-500'} font-medium`}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="#2D3748" style={{ marginTop: 50 }} />
                ) : filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                        <View style={styles.leaveApplicationItem} key={task.id}>
                            <View style={styles.leaveApplicationInfo}>
                                <Image
                                    source={{ uri: task.employee?.avatarUrl || 'https://img.freepik.com/free-photo/front-view-man-posing_23-2148364843.jpg' }}
                                    style={styles.leaveApplicationImage}
                                />
                                <View style={styles.leaveApplicationText}>
                                    <Text style={styles.leaveApplicantName}>{task.employee?.name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <AntDesign name="calendar" size={10} color="#A0AEC0" />
                                        <Text style={styles.leaveDates}> {formatDate(task.fromdate)} - {formatDate(task.todate)}</Text>
                                    </View>
                                    <Text style={styles.leaveType}>{task.title}</Text>
                                </View>
                            </View>
                            <View style={styles.leaveActions}>
                                {task.status === 'SUBMITTED' && (
                                    <>
                                        <TouchableOpacity style={styles.cancelButton} onPress={() => handleUpdateStatus(task.id, 'REJECTED')}>
                                            <Text style={styles.cancelButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.approveButton} onPress={() => handleUpdateStatus(task.id, 'ACCEPTED')}>
                                            <Text style={styles.approveButtonText}>Approve</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={{ marginTop: 50, alignItems: 'center' }}>
                        <Text style={{ color: 'gray' }}>No requests in this category</Text>
                    </View>
                )}
            </ScrollView>
        </View >
    )
}

export default Leave_Applications;

const styles = StyleSheet.create({
    leaveApplicationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        marginTop: 8,
    },
    leaveApplicationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leaveApplicationImage: {
        height: 64,
        width: 64,
        borderRadius: 32,
    },
    leaveApplicationText: {
        marginLeft: 8,
        justifyContent: 'center',
        gap: 2
    },
    leaveApplicantName: {
        fontSize: 16,
        fontWeight: '600',
    },
    leaveDates: {
        fontSize: 12,
        color: '#A0AEC0',
        fontWeight: '500',
    },
    leaveType: {
        fontSize: 12,
        fontWeight: '500',
        color: '#E53E3E',
    },
    leaveActions: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#FED7D7',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 30,
        marginBottom: 8,
    },
    cancelButtonText: {
        color: '#E53E3E',
        fontSize: 13,
        fontWeight: '500',
    },
    approveButton: {
        backgroundColor: '#C6F6D5',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 27,
    },
    approveButtonText: {
        color: '#38A169',
        fontSize: 13,
        fontWeight: '500',
    },
})