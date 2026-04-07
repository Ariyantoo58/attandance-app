import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native'
import React, { useState, useEffect } from 'react';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { apiService } from '../../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHrDashboard } from '@/auth/dataSlice';
import { useSocket } from '../../../context/SocketContext';

const Leave_Applications = () => {
    const navigation = useNavigation();
    const authState = useSelector(state => state.auth.user);
    const userId = authState?.id || authState?.user?.id;
    const [filter, setFilter] = useState('Waiting');
    const { leaveRequests: requests, loading } = useSelector(state => state.data.hrDashboard);
    const dispatch = useDispatch();

    const { socket } = useSocket();

    const loadRequests = () => {
        dispatch(fetchHrDashboard());
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
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="menu" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leave Applications</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.filterRow}>
                    {['Waiting', 'Approved', 'Cancelled'].map(status => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilter(status)}
                            style={[
                                styles.filterItem,
                                filter === status ? styles.filterActive : styles.filterInactive
                            ]}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === status ? styles.filterTextActive : styles.filterTextInactive
                            ]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.listContainer}>
                    {(loading && requests.length === 0) ? (
                        <View style={styles.loaderArea}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                        </View>
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <View style={styles.requestCard} key={task.id}>
                                <View style={styles.cardInfo}>
                                    <Image
                                        source={{ uri: task.employee?.avatarUrl || 'https://img.freepik.com/free-photo/front-view-man-posing_23-2148364843.jpg' }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.textColumn}>
                                        <Text style={styles.employeeName}>{task.employee?.name}</Text>
                                        <View style={styles.dateRow}>
                                            <AntDesign name="calendar" size={12} color="#EF4444" />
                                            <Text style={styles.dateRange}> {formatDate(task.fromdate)} - {formatDate(task.todate)}</Text>
                                        </View>
                                        <View style={styles.typeBadge}>
                                            <Text style={styles.typeText}>{task.title}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.actionColumn}>
                                    {task.status === 'SUBMITTED' ? (
                                        <View style={styles.buttonStack}>
                                            <TouchableOpacity 
                                                style={styles.approveBtn} 
                                                onPress={() => handleUpdateStatus(task.id, 'ACCEPTED')}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.approveTxt}>Approve</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.rejectBtn} 
                                                onPress={() => handleUpdateStatus(task.id, 'REJECTED')}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.rejectTxt}>Reject</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={[
                                            styles.statusTag, 
                                            { backgroundColor: task.status === 'ACCEPTED' ? '#ECFDF5' : '#FEF2F2' }
                                        ]}>
                                            <Text style={[
                                                styles.statusTagText,
                                                { color: task.status === 'ACCEPTED' ? '#059669' : '#DC2626' }
                                            ]}>
                                                {task.status === 'ACCEPTED' ? 'Approved' : 'Cancelled'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <AntDesign name="filetext1" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No requests found</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View >
    )
}

export default Leave_Applications;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EFF6FF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 50,
        backgroundColor: 'white',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 3,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    filterItem: {
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        width: (Dimensions.get('window').width - 60) / 3,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    filterActive: {
        backgroundColor: '#1E293B',
        borderColor: '#1E293B',
    },
    filterInactive: {
        backgroundColor: 'white',
        borderColor: '#E2E8F0',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    filterTextActive: {
        color: 'white',
    },
    filterTextInactive: {
        color: '#64748B',
    },
    listContainer: {
        paddingBottom: 40,
    },
    requestCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.5)',
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        height: 60,
        width: 60,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
    },
    textColumn: {
        marginLeft: 14,
        flex: 1,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    dateRange: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    typeBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    typeText: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: '700',
    },
    actionColumn: {
        marginLeft: 10,
        alignItems: 'flex-end',
    },
    buttonStack: {
        gap: 8,
    },
    approveBtn: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    approveTxt: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    rejectBtn: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EF4444',
        alignItems: 'center',
    },
    rejectTxt: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '700',
    },
    statusTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: '700',
    },
    loaderArea: {
        marginTop: 60,
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
    },
})