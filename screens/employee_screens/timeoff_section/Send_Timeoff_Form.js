import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';

const Send_Timeoff_Form = () => {
    const navigation = useNavigation();
    const [type, setType] = useState('');
    const [reason, setReason] = useState('');
    const [isFullDay, setIsFullDay] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [halfDayTime, setHalfDayTime] = useState('');
    const [selectedField, setSelectedField] = useState('');
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);
    const [mode, setMode] = useState('date');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Attempt to get employeeId from nested or flat user object
    const authState = useSelector(state => state.auth.user);
    const employeeId = authState?.employeeId || authState?.user?.employeeId;
    const userRole = authState?.role || authState?.user?.role;

    const handleSend = async () => {
        if (!type || !reason || !startDate || !endDate) {
            Alert.alert("Error", "Please fill all required fields.");
            return;
        }

        try {
            setIsSubmitting(true);
            const requestData = {
                employeeId,
                title: `Leave Request: ${type}`,
                description: `${reason}${isFullDay ? ` (${isFullDay}${halfDayTime ? ` - ${new Date(halfDayTime).toLocaleTimeString()}` : ''})` : ''}`,
                fromdate: startDate,
                todate: endDate,
                type: type.toUpperCase().replace(" ", "_")
            };

            await apiService.requestTimeOff(requestData);
            Alert.alert("Success", "Leave request submitted successfully.");
            
            setType("");
            setReason("");
            setIsFullDay("");
            setStartDate("");
            setEndDate("");
            setHalfDayTime("");

            navigation.goBack();
        } catch (error) {
            console.error("Failed to submit leave request:", error);
            Alert.alert("Error", "Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDateTimePicker = (field, mode) => {
        setSelectedField(field);
        setMode(mode);
        setShowDateTimePicker(true);
    };

    const onChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDateTimePicker(false);
        }
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            if (selectedField === 'startDate') {
                setStartDate(formattedDate);
            } else if (selectedField === 'endDate') {
                setEndDate(formattedDate);
            } else if (selectedField === 'halfDayTime') {
                setHalfDayTime(selectedDate.toISOString());
            }
        }
    };

    return (
        <View style={styles.container} className="pt-12 px-4 bg-blue-50">
            <View style={styles.header}>
                <TouchableOpacity className="bg-blue-400" style={styles.backButton} onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={18} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Time Off Request</Text>
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.pickerWrapper}>
                    <RNPickerSelect
                        onValueChange={(value) => setType(value)}
                        items={[
                            { label: 'Vacation', value: 'Vacation' },
                            { label: 'Sick Leave', value: 'Sick Leave' },
                            { label: 'Maternity Leave', value: 'Maternity Leave' },
                            { label: 'Paternity Leave', value: 'Paternity Leave' },
                            { label: 'Other', value: 'Other' },
                        ]}
                        style={pickerSelectStyles}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => <AntDesign name="caretdown" size={12} color="#666" style={{ marginTop: Platform.OS === 'ios' ? 18 : 15, marginRight: 15 }} />}
                    />
                </View>
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Reason</Text>
                <TextInput
                    multiline
                    numberOfLines={8}
                    value={reason}
                    onChangeText={setReason}
                    style={styles.textInput}
                />
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Shift Type</Text>
                <View style={styles.pickerWrapper}>
                    <RNPickerSelect
                        onValueChange={(value) => setIsFullDay(value)}
                        items={[
                            { label: 'Full Day', value: 'Full Day' },
                            { label: 'Half Day', value: 'Half Day' },
                            { label: 'Holiday', value: 'Holiday' },
                        ]}
                        style={pickerSelectStyles}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => <AntDesign name="caretdown" size={12} color="#666" style={{ marginTop: Platform.OS === 'ios' ? 18 : 15, marginRight: 15 }} />}
                    />
                </View>
            </View>
            {isFullDay === 'Half Day' && (
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Select Time</Text>
                    <TouchableOpacity onPress={() => openDateTimePicker('halfDayTime', 'time')} style={styles.dateTimeButton}>
                        <Text>{halfDayTime ? new Date(halfDayTime).toLocaleTimeString() : 'Select Time'}</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity onPress={() => openDateTimePicker('startDate', 'date')} style={styles.dateTimeButton}>
                    <Text>{startDate ? startDate : 'Select Date'}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity onPress={() => openDateTimePicker('endDate', 'date')} style={styles.dateTimeButton}>
                    <Text>{endDate ? endDate : 'Select Date'}</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity 
                onPress={handleSend} 
                style={[styles.sendButton, isSubmitting && { opacity: 0.7 }]} 
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.sendButtonText}>Submit</Text>
                )}
            </TouchableOpacity>
            {Platform.OS === 'ios' ? (
                <Modal
                    visible={showDateTimePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowDateTimePicker(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalOverlay} 
                        activeOpacity={1} 
                        onPress={() => setShowDateTimePicker(false)}
                    >
                        <View style={styles.datePickerModalContent}>
                            <View style={styles.datePickerHeader}>
                                <Text style={styles.datePickerTitle}>
                                    {selectedField === 'halfDayTime' ? 'Select Time' : 'Select Date'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowDateTimePicker(false)}>
                                    <Text style={styles.datePickerDoneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={
                                    selectedField === 'startDate' && startDate ? new Date(startDate) : 
                                    selectedField === 'endDate' && endDate ? new Date(endDate) : 
                                    selectedField === 'halfDayTime' && halfDayTime ? new Date(halfDayTime) : 
                                    new Date()
                                }
                                mode={mode}
                                display="inline"
                                onChange={onChange}
                                themeVariant="light"
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>
            ) : (
                showDateTimePicker && (
                    <DateTimePicker
                        value={
                            selectedField === 'startDate' && startDate ? new Date(startDate) : 
                            selectedField === 'endDate' && endDate ? new Date(endDate) : 
                            selectedField === 'halfDayTime' && halfDayTime ? new Date(halfDayTime) : 
                            new Date()
                        }
                        mode={mode}
                        display="default"
                        onChange={onChange}
                    />
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    backButton: {
        width: 28,
        borderRadius: 5,
        padding: 4
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        width: '88%',
        textAlign: 'center'
    },
    formGroup: {
        paddingVertical: 6,
        marginBottom: 5
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5
    },
    textInput: {
        height: 150,
        // borderWidth: 1,
        borderColor: 'gray',
        padding: 5,
        backgroundColor: '#fff',
        borderRadius: 10
    },
    dateTimeButton: {
        // borderWidth: 1,
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#fff'
    },
    sendButton: {
        backgroundColor: '#00a2e4',
        padding: 12,
        borderRadius: 10,
        marginTop: 20
    },
    sendButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 18
    },
    pickerWrapper: {
        // borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 10,
        backgroundColor: '#fff',
        overflow: 'hidden'
    },
    // Date Picker Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
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
        height: 50,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#1e293b',
        paddingRight: 30,
    },
    inputAndroid: {
        height: 50,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#1e293b',
        paddingRight: 30,
    }
};

export default Send_Timeoff_Form;
