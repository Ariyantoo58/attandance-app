import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    Image,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { apiService } from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculatePayrollAutomation, TAX_STATUS } from '../../../services/taxCalculator';
import RNPickerSelect from 'react-native-picker-select';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHrDashboard } from '@/auth/dataSlice';
import { useSocket } from '../../../context/SocketContext';

const formatCurrency = (value) => {
    return `Rp ${Math.floor(value || 0).toLocaleString('id-ID')}`;
};

const CalculationDetail = ({ label, value, subtext }) => (
    <View style={styles.calcRow}>
        <View>
            <Text style={styles.calcLabel}>{label}</Text>
            {subtext && <Text style={styles.calcSubtext}>{subtext}</Text>}
        </View>
        <Text style={styles.calcValue}>{formatCurrency(value)}</Text>
    </View>
);

const FormInput = ({ label, value, field, icon, color = "#4A90E2", onNumericChange }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputWrapper}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <TextInput
                style={styles.input}
                value={value === '0' ? '' : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                onChangeText={(val) => onNumericChange(val, field)}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                placeholder="0"
                placeholderTextColor="#CBD5E1"
            />
        </View>
    </View>
);

const PaySlipofEmployee = () => {
    const navigation = useNavigation();
    const { allEmployees: employees, loading: storeLoading } = useSelector(state => state.data.hrDashboard);
    const dispatch = useDispatch();

    const [monthlyPayrolls, setMonthlyPayrolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fetching, setFetching] = useState(false);

    // Form State
    const [form, setForm] = useState({
        basicSalary: '0',
        overtime: '0',
        bonuses: '0',
        pph21: '0',
        bpjsKetenagakerjaan: '0',
        bpjsKesehatan: '0',
        lateDeduction: '0',
        otherDeductions: '0',
    });

    const { socket } = useSocket();

    // Initial fetch for payrolls
    useEffect(() => {
        fetchPayrolls();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('payroll_changed', (data) => {
                fetchPayrolls();
            });

            socket.on('employee_changed', (data) => {
                dispatch(fetchHrDashboard());
            });

            return () => {
                socket.off('payroll_changed');
                socket.off('employee_changed');
            };
        }
    }, [socket]);

    const fetchPayrolls = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const payrollData = await apiService.getMonthlyPayrolls(month, year);
            setMonthlyPayrolls(payrollData);
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        await dispatch(fetchHrDashboard());
        await fetchPayrolls();
    };

    useEffect(() => {
        if (selectedEmployee && (form.basicSalary || form.overtime || form.bonuses)) {
            const gross = (parseFloat(form.basicSalary) || 0) + (parseFloat(form.overtime) || 0) + (parseFloat(form.bonuses) || 0);
            const status = selectedEmployee.ptkpStatus || 'TK0';
            const auto = calculatePayrollAutomation(gross, status);
            
            setForm(prev => ({
                ...prev,
                pph21: auto.pph21.toString(),
                bpjsKetenagakerjaan: auto.bpjsKetenagakerjaan.toString(),
                bpjsKesehatan: auto.bpjsKesehatan.toString(),
            }));
        }
    }, [form.basicSalary, form.overtime, form.bonuses, selectedEmployee]);

    const handleOpenRecord = (employee) => {
        setSelectedEmployee(employee);
        setForm({
            basicSalary: (employee.salary || 0).toString(),
            overtime: '0',
            bonuses: '0',
            pph21: '0',
            bpjsKetenagakerjaan: '0',
            bpjsKesehatan: '0',
            lateDeduction: '0',
            otherDeductions: '0',
        });
        setModalVisible(true);
    };

    const handleSyncAttendance = async () => {
        if (!selectedEmployee) return;
        
        try {
            setFetching(true);
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            
            const attendance = await apiService.getMonthlyAttendance(selectedEmployee.id, month, year);
            
            let lateCount = 0;
            attendance.forEach(record => {
                const clockIn = new Date(record.clockIn);
                const hour = clockIn.getHours();
                const minutes = clockIn.getMinutes();
                
                // Late if after 08:30
                if (hour > 8 || (hour === 8 && minutes > 30)) {
                    lateCount++;
                }
            });
            
            const totalPenalty = lateCount * 25000;
            setForm(prev => ({ ...prev, lateDeduction: totalPenalty.toString() }));
            
            Alert.alert('Attendance Synced', `Found ${lateCount} late arrivals for this month. Total deduction: ${formatCurrency(totalPenalty)}`);
        } catch (error) {
            console.error('Sync failed:', error);
            Alert.alert('Sync Failed', 'Could not retrieve attendance records.');
        } finally {
            setFetching(false);
        }
    };

    const calculateTotals = () => {
        const basic = parseFloat(form.basicSalary) || 0;
        const overtime = parseFloat(form.overtime) || 0;
        const bonuses = parseFloat(form.bonuses) || 0;
        const pph21 = parseFloat(form.pph21) || 0;
        const bpjsKt = parseFloat(form.bpjsKetenagakerjaan) || 0;
        const bpjsKs = parseFloat(form.bpjsKesehatan) || 0;
        const late = parseFloat(form.lateDeduction) || 0;
        const other = parseFloat(form.otherDeductions) || 0;

        const earnings = basic + overtime + bonuses;
        const deductions = pph21 + bpjsKt + bpjsKs + late + other;
        const net = earnings - deductions;

        return { earnings, deductions, net };
    };

    const handleSubmitPayroll = async () => {
        if (!selectedEmployee) return;

        try {
            setSubmitting(true);
            const { net } = calculateTotals();
            const now = new Date();
            
            const payload = {
                employeeId: selectedEmployee.id,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                basicSalary: parseFloat(form.basicSalary) || 0,
                overtime: parseFloat(form.overtime) || 0,
                bonuses: parseFloat(form.bonuses) || 0,
                pph21: parseFloat(form.pph21) || 0,
                bpjsKetenagakerjaan: parseFloat(form.bpjsKetenagakerjaan) || 0,
                bpjsKesehatan: parseFloat(form.bpjsKesehatan) || 0,
                lateDeduction: parseFloat(form.lateDeduction) || 0,
                otherDeductions: parseFloat(form.otherDeductions) || 0,
            };
            await apiService.createPayroll(payload);
            // Success
            Alert.alert(
                'Success', 
                'Payroll processed successfully!',
                [
                    { text: 'Download PDF', onPress: () => generatePDF(selectedEmployee, payload) },
                    { text: 'Close', style: 'cancel' }
                ]
            );
            await fetchEmployees();
            setModalVisible(false);
        } catch (error) {
            console.error('Error submitting payroll:', error);
            Alert.alert('Error', 'Failed to record payroll. This employee might already have a record for this month.');
        } finally {
            setSubmitting(false);
        }
    };

    const generatePDF = async (employee, data) => {
        const { earnings, deductions, net } = calculateTotals();
        const currentDate = new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                    .company-name { font-size: 24px; font-weight: bold; color: #2D3748; margin: 0; }
                    .subtitle { font-size: 14px; color: #718096; margin-top: 5px; }
                    .payslip-title { font-size: 20px; text-align: center; margin: 20px 0; font-weight: bold; text-transform: uppercase; }
                    
                    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .info-box { flex: 1; }
                    .info-label { font-size: 10px; color: #718096; text-transform: uppercase; font-weight: bold; }
                    .info-value { font-size: 14px; font-weight: 600; margin-top: 2px; }

                    .table-container { margin-bottom: 40px; display: flex; gap: 40px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; background: #F8FAFC; padding: 12px; font-size: 12px; border-bottom: 1px solid #E2E8F0; }
                    td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F1F5F9; }
                    .amount { text-align: right; }
                    
                    .summary-section { background: #F1F5F9; padding: 20px; border-radius: 8px; margin-top: 20px; }
                    .grand-total { font-size: 18px; font-weight: bold; color: #2D3748; display: flex; justify-content: space-between; align-items: center; }
                    .footer { margin-top: 60px; font-size: 12px; color: #718096; text-align: center; }
                    .signature-box { margin-top: 80px; display: flex; justify-content: space-between; }
                    .signature-line { width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <p class="company-name">PT. MAJU BERSAMA HRIS</p>
                    <p class="subtitle">Salary Slip for Period: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                </div>

                <div class="info-section">
                    <div class="info-box">
                        <div class="info-label">Employee Name</div>
                        <div class="info-value">${employee.name}</div>
                        <div class="info-label" style="margin-top:10px">Designation</div>
                        <div class="info-value">${employee.designation || '-'}</div>
                    </div>
                    <div class="info-box" style="text-align: right;">
                        <div class="info-label">Date Generated</div>
                        <div class="info-value">${currentDate}</div>
                        <div class="info-label" style="margin-top:10px">Status</div>
                        <div class="info-value" style="color: #48BB78;">PAID</div>
                    </div>
                </div>

                <div style="display: flex; gap: 40px;">
                    <div style="flex: 1;">
                        <div class="payslip-title" style="text-align: left; font-size: 14px; border-left: 4px solid #4299E1; padding-left: 10px;">Earnings</div>
                        <table>
                            <tr><td>Basic Salary</td><td class="amount">${formatCurrency(data.basicSalary)}</td></tr>
                            <tr><td>Overtime (Lembur)</td><td class="amount">${formatCurrency(data.overtime)}</td></tr>
                            <tr><td>Bonuses</td><td class="amount">${formatCurrency(data.bonuses)}</td></tr>
                            <tr style="font-weight: bold; background: #EDF2F7;"><td>Total Earnings</td><td class="amount">${formatCurrency(earnings)}</td></tr>
                        </table>
                    </div>
                    <div style="flex: 1;">
                        <div class="payslip-title" style="text-align: left; font-size: 14px; border-left: 4px solid #F56565; padding-left: 10px;">Deductions</div>
                        <table>
                            <tr><td>PPH21 (Income Tax)</td><td class="amount">${formatCurrency(data.pph21)}</td></tr>
                            <tr><td>BPJS Ketenagakerjaan</td><td class="amount">${formatCurrency(data.bpjsKetenagakerjaan)}</td></tr>
                            <tr><td>BPJS Kesehatan</td><td class="amount">${formatCurrency(data.bpjsKesehatan)}</td></tr>
                            <tr><td>Late Deduction (Terlambat)</td><td class="amount">${formatCurrency(data.lateDeduction)}</td></tr>
                            <tr><td>Other</td><td class="amount">${formatCurrency(data.otherDeductions)}</td></tr>
                            <tr style="font-weight: bold; background: #FED7D7;"><td>Total Deductions</td><td class="amount">${formatCurrency(deductions)}</td></tr>
                        </table>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="grand-total">
                        <span>NET SALARY</span>
                        <span>${formatCurrency(net)}</span>
                    </div>
                </div>

                <div class="signature-box">
                    <div>
                        <p>Employee Signature</p>
                        <div class="signature-line" style="margin-top: 60px;">${employee.name}</div>
                    </div>
                    <div>
                        <p>Authorized Signature</p>
                        <div class="signature-line" style="margin-top: 60px;">HR Manager</div>
                    </div>
                </div>

                <div class="footer">
                    <p>Generated automatically by HR Management System. This is a computer-generated document and does not require a physical stamp.</p>
                </div>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
    };

    const renderEmployeeItem = ({ item }) => {
        const payrollRecord = monthlyPayrolls.find(p => p.employeeId === item.id);
        const isPaid = !!payrollRecord;

        return (
            <TouchableOpacity 
                style={[styles.employeeCard, isPaid && styles.paidCard]} 
                onPress={() => handleOpenRecord(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.avatarWrapper}>
                        {item.avatarUrl ? (
                            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.initialsContainer}>
                                <Text style={styles.initialsText}>
                                    {item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.statusDot, { backgroundColor: isPaid ? '#48BB78' : '#A0AEC0' }]} />
                    </View>
                    
                    <View style={styles.employeeInfo}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.designation}>{item.designation || 'General Staff'}</Text>
                        <View style={styles.salaryTag}>
                            <Text style={styles.salaryText}>Base: {formatCurrency(item.salary)}</Text>
                        </View>
                    </View>

                    <View style={styles.paymentStatus}>
                        {isPaid ? (
                            <View style={styles.paidContent}>
                                <Text style={styles.paidAmount}>{formatCurrency(payrollRecord.netSalary)}</Text>
                                <View style={styles.statusBadge}>
                                    <MaterialIcons name="check-circle" size={12} color="#48BB78" />
                                    <Text style={styles.statusText}>PAID</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.actionPrompt}>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
                            </View>
                        )}
                    </View>
                </View>

                {isPaid && (
                   <View style={styles.paidDetails}>
                       <View style={styles.paidDetailItem}>
                           <Text style={styles.detailLabel}>Period</Text>
                           <Text style={styles.detailValue}>{new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</Text>
                       </View>
                       <View style={styles.divider} />
                       <View style={styles.paidDetailItem}>
                           <Text style={styles.detailLabel}>Net Salary</Text>
                           <Text style={[styles.detailValue, {color: '#2B6CB0'}]}>Processed</Text>
                       </View>
                   </View>
                )}
            </TouchableOpacity>
        );
    };

    const handleNumericChange = React.useCallback((val, field) => {
        if (val === '') {
            setForm(prev => ({ ...prev, [field]: '' }));
            return;
        }
        let raw = val.replace(/[^0-9]/g, '');
        if (raw.length > 1 && raw.startsWith('0')) {
            raw = raw.replace(/^0+/, '');
        }
        setForm(prev => ({ ...prev, [field]: raw }));
    }, []);

    const { earnings, deductions, net } = calculateTotals();

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loaderText}>Loading employees...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={styles.menuBtn}
                    >
                        <Ionicons name="menu" size={26} color="#2D3748" />
                    </TouchableOpacity>
                    <View style={styles.headerTextWrapper}>
                        <Text style={styles.title}>Payroll Management</Text>
                    </View>
                </View>
                <Text style={styles.subtitle}>Select an employee to record monthly salary</Text>
            </View>

            <FlatList
                data={employees}
                renderItem={renderEmployeeItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalScrollContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#2D3748" />
                            </TouchableOpacity>
                            <Text style={styles.modalHeaderText}>Record Payroll</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                            <View style={styles.employeeShortInfo}>
                                <Text style={styles.empNameLabel}>{selectedEmployee?.name}</Text>
                                <Text style={styles.empSubLabel}>{selectedEmployee?.ptkpStatus || 'TK0'}</Text>
                                <View style={styles.autoBadge}>
                                    <MaterialCommunityIcons name="robot" size={14} color="#3182CE" />
                                    <Text style={styles.autoBadgeText}>Auto-Calculation Active (Employee Status)</Text>
                                </View>
                            </View>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Earnings (Pendapatan)</Text>
                                <View style={styles.titleUnderline} />
                            </View>
                            
                            <FormInput 
                                label="Basic Salary" 
                                icon="cash-multiple" 
                                field="basicSalary"
                                value={form.basicSalary}
                                onNumericChange={handleNumericChange}
                            />
                            <FormInput 
                                label="Overtime (Lembur)" 
                                icon="clock-fast" 
                                color="#48BB78"
                                field="overtime"
                                value={form.overtime}
                                onNumericChange={handleNumericChange}
                            />
                            <FormInput 
                                label="Bonuses" 
                                icon="gift" 
                                color="#F6AD55"
                                field="bonuses"
                                value={form.bonuses}
                                onNumericChange={handleNumericChange}
                            />
 
                            <View style={[styles.sectionHeader, { marginTop: 25 }]}>
                                <Text style={styles.sectionTitle}>Deductions (Potongan)</Text>
                                <View style={[styles.titleUnderline, { backgroundColor: '#F56565' }]} />
                            </View>
 
                            <FormInput 
                                label="PPH21 (Income Tax)" 
                                icon="file-percent" 
                                color="#F56565"
                                field="pph21"
                                value={form.pph21}
                                onNumericChange={handleNumericChange}
                            />
                            <FormInput 
                                label="BPJS Ketenagakerjaan" 
                                icon="shield-check" 
                                color="#805AD5"
                                field="bpjsKetenagakerjaan"
                                value={form.bpjsKetenagakerjaan}
                                onNumericChange={handleNumericChange}
                            />
                            <FormInput 
                                label="BPJS Kesehatan" 
                                icon="heart-pulse" 
                                color="#ED64A6"
                                field="bpjsKesehatan"
                                value={form.bpjsKesehatan}
                                onNumericChange={handleNumericChange}
                            />
                            <View style={styles.inputWithAction}>
                                <View style={{ flex: 1 }}>
                                    <FormInput 
                                        label="Potongan Telat (Sync Logic)" 
                                        icon="timer-off" 
                                        color="#E53E3E"
                                        field="lateDeduction"
                                        value={form.lateDeduction}
                                        onNumericChange={handleNumericChange}
                                    />
                                </View>
                                <TouchableOpacity 
                                    style={[styles.syncButton, fetching && { opacity: 0.6 }]} 
                                    onPress={handleSyncAttendance}
                                    disabled={fetching}
                                >
                                    {fetching ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="sync" size={18} color="white" />
                                            <Text style={styles.syncButtonText}>Sync</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <FormInput 
                                label="Other Deductions" 
                                icon="minus-circle" 
                                color="#718096"
                                field="otherDeductions"
                                value={form.otherDeductions}
                                onNumericChange={handleNumericChange}
                            />

                            <View style={styles.breakdownCard}>
                                <Text style={styles.breakdownTitle}>Automation Details</Text>
                                <CalculationDetail 
                                    label="PPh21 (Pajak TER)" 
                                    value={form.pph21} 
                                    subtext={`Cat ${selectedEmployee?.ptkpStatus ? (calculatePayrollAutomation((parseFloat(form.basicSalary)||0)+(parseFloat(form.overtime)||0)+(parseFloat(form.bonuses)||0), selectedEmployee.ptkpStatus).category) : 'A'} | Rate: ${selectedEmployee?.ptkpStatus ? (calculatePayrollAutomation((parseFloat(form.basicSalary)||0)+(parseFloat(form.overtime)||0)+(parseFloat(form.bonuses)||0), selectedEmployee.ptkpStatus).rate) : 0}%`}
                                />
                                <CalculationDetail 
                                    label="BPJS Ketenagakerjaan (3%)" 
                                    value={form.bpjsKetenagakerjaan} 
                                    subtext="JHT 2% + JP 1% (Cap Applied)"
                                />
                                <CalculationDetail 
                                    label="BPJS Kesehatan (1%)" 
                                    value={form.bpjsKesehatan} 
                                    subtext="Limit Up to Rp 12M"
                                />
                            </View>

                            <View style={{ height: 100 }} />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <View style={styles.totalPreview}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Gross Earnings</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(earnings)}</Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total Deductions</Text>
                                    <Text style={[styles.totalValue, { color: '#F56565' }]}>- {formatCurrency(deductions)}</Text>
                                </View>
                                <View style={[styles.totalRow, styles.netRow]}>
                                    <Text style={styles.netLabel}>NET SALARY</Text>
                                    <Text style={styles.netValue}>{formatCurrency(net)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.submitButton, submitting && styles.disabledButton]} 
                                onPress={handleSubmitPayroll}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={styles.submitButtonText}>Submit & Generate</Text>
                                        <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    menuBtn: {
        marginRight: 12,
        padding: 4,
    },
    headerTextWrapper: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    subtitle: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    employeeCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    paidCard: {
        borderColor: '#E2E8F0',
        backgroundColor: '#FDFDFF',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    initialsContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: '#3B82F6',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: 'white',
    },
    employeeInfo: {
        flex: 1,
        marginLeft: 14,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    designation: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 6,
    },
    salaryTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    salaryText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
    },
    paymentStatus: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    paidContent: {
        alignItems: 'flex-end',
    },
    paidAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: '#2D3748',
        marginBottom: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#15803D',
        marginLeft: 4,
    },
    actionPrompt: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paidDetails: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        alignItems: 'center',
    },
    paidDetailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 9,
        color: '#94A3B8',
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 12,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 12,
        color: '#718096',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    inputWithAction: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    syncButton: {
        backgroundColor: '#48BB78',
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    syncButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 12,
    },
    modalScrollContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '92%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    formContainer: {
        padding: 20,
    },
    employeeShortInfo: {
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 15,
    },
    empNameLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    empSubLabel: {
        fontSize: 14,
        color: '#718096',
    },
    autoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
    },
    autoBadgeText: {
        fontSize: 11,
        color: '#3182CE',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    sectionHeader: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4A5568',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    titleUnderline: {
        height: 3,
        width: 40,
        backgroundColor: '#4A90E2',
        marginTop: 4,
        borderRadius: 2,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
    },
    iconBox: {
        padding: 8,
        borderRadius: 8,
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    modalFooter: {
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    totalPreview: {
        marginBottom: 20,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    totalLabel: {
        fontSize: 14,
        color: '#718096',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    netRow: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    netLabel: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2D3748',
    },
    netValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#3B82F6',
    },
    submitButton: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    calcLabel: {
        fontSize: 13,
        color: '#4A5568',
        fontWeight: '600',
    },
    calcSubtext: {
        fontSize: 10,
        color: '#A0AEC0',
    },
    calcValue: {
        fontSize: 13,
        color: '#2D3748',
        fontWeight: 'bold',
    },
    breakdownCard: {
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 15,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    breakdownTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#718096',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
});

const pickerStyles = {
    inputIOS: {
        fontSize: 14,
        paddingVertical: 4,
        paddingHorizontal: 0,
        color: '#3182CE',
        fontWeight: 'bold',
    },
    inputAndroid: {
        fontSize: 14,
        paddingHorizontal: 0,
        paddingVertical: 4,
        color: '#3182CE',
        fontWeight: 'bold',
    },
};

export default PaySlipofEmployee;
