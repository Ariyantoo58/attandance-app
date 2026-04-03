import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import moment from 'moment';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getCurrentWeekDates = () => {
    const now = new Date();
    return days.map((_, i) => {
        const day = new Date(now);
        day.setDate(now.getDate() - now.getDay() + i);
        return day.getDate();
    });
};

const getFormattedDate = () => {
    const now = new Date();
    const options = { month: 'long', day: '2-digit', year: 'numeric' };
    return now.toLocaleDateString('en-US', options);
};

const ProjectTasks = () => {
    const navigation = useNavigation();
    const weekDates = getCurrentWeekDates();
    const [allTasks, setAllTasks] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAllTasks();
            setAllTasks(data);
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelection = (day) => {
        setSelectedDate(day);
        if (!day) {
            setTasks(allTasks);
        } else {
            const filtered = allTasks.filter(t => moment(t.date).format('D') === day.toString());
            setTasks(filtered);
        }
    };

    const getDayContainerStyle = (day) => ({
        ...styles.dayContainer,
        borderBottomWidth: selectedDate === day ? 2 : 0,
        borderBottomColor: selectedDate === day ? 'white' : 'transparent',
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING':
                return { color: '#F75353' }; // Red
            case 'IN_PROGRESS':
                return { color: '#38A169' }; // Green
            case 'COMPLETED':
                return { color: '#3182CE' }; // Blue
            default:
                return { color: '#fff' };
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return '#F75353';
            case 'IN_PROGRESS':
                return '#38A169';
            case 'COMPLETED':
                return '#3182CE';
            default:
                return 'gray';
        }
    };

    return (
        <View style={styles.container} className="bg-gray-700">
            <View style={styles.header} className="px-3">
                <TouchableOpacity 
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }} 
                    onPress={() => navigation.goBack()}
                >
                    <AntDesign name="left" size={18} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Project Tasks</Text>
                <TouchableOpacity 
                    style={{ width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }} 
                    onPress={() => navigation.navigate("TaskCreation")}
                >
                    <Feather name="plus-circle" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.dateSection}>
                <Text style={styles.monthDateText}>{getFormattedDate()}</Text>
                {/* <Text style={styles.todayDateText}>Today: {weekDates[new Date().getDay()]}</Text> */}
            </View>
            <View style={styles.weekRow}>
                {days.map((day, index) => (
                    <TouchableOpacity
                        key={day}
                        style={getDayContainerStyle(day)}
                        onPress={() => handleDateSelection(day, index)}
                    >
                        <Text style={styles.dayText}>{day}</Text>
                        <Text style={styles.dateText}>{weekDates[index]}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView style={styles.cardsContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginTop: 50 }} />
                ) : tasks.length > 0 ? (
                    tasks.map((task) => (
                        <View key={task.id} style={styles.card} className="border-l-[3px] bordr-[0.2px] border-white">
                            <View className="flex-row items-center pb-2 border-b border-gray-400">
                                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(task.status) }]} />
                                <Text style={[styles.status, getStatusStyle(task.status)]}>{task.status}</Text>
                            </View>
                            <Text style={styles.taskName}>{task.title}</Text>
                            <Text style={styles.assignedTeamText}>Assigned to: {task.employee?.name || 'Unassigned'}</Text>
                            <View style={styles.cardFooter}>
                                <View style={styles.footerItem}>
                                    <AntDesign name="clockcircle" size={15} color="white" />
                                    <Text style={styles.timeRange}>{moment(task.date).format('DD MMM')}</Text>
                                </View>
                                <View style={styles.footerItem}>
                                    <MaterialIcons name="flag" size={18} color="white" />
                                    <Text style={styles.peopleCount}>{task.priority}</Text>
                                </View>
                                <TouchableOpacity onPress={() => alert('Delete Task')}>
                                    <MaterialIcons name="delete-outline" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={{ marginTop: 50, alignItems: 'center' }}>
                         <Text style={{ color: 'gray' }}>No tasks found</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#1E1E1E',
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 35,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    dateSection: {
        marginBottom: 10,
    },
    monthDateText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    todayDateText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 5,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dayContainer: {
        alignItems: 'center',
        padding: 10,
    },
    dayText: {
        color: '#fff',
        fontSize: 13,
    },
    dateText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    cardsContainer: {
        flex: 1,
    },
    card: {
        backgroundColor: '#2E2E2E',
        padding: 15,
        borderRadius: 13,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    status: {
        fontWeight: 'bold',
        color: '#fff',
    },
    taskName: {
        color: '#fff',
        fontSize: 20,
        marginBottom: 2,
        fontWeight: '600',
        marginTop: 5
    },
    assignedTeamText: {
        color: '#fff',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeRange: {
        marginLeft: 5,
        marginRight: 20,
        color: '#fff',
    },
    peopleCount: {
        marginLeft: 5,
        color: '#fff',
    },
});

export default ProjectTasks;