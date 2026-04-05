import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import { AntDesign, Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Wallet } from '../../../assets/index';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';
import { calculatePayrollAutomation, TAX_STATUS } from '../../../services/taxCalculator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PaySlip = () => {
    const navigation = useNavigation();
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [employeePtkp, setEmployeePtkp] = useState('TK0');
    const employeeId = useSelector(state => state.auth.user?.user?.employeeId);

    useEffect(() => {
        if (employeeId) {
            loadPayroll();
        }
    }, [employeeId]);

    const loadPayroll = async () => {
        try {
            setLoading(true);
            const [payrollData, profileData] = await Promise.all([
                apiService.getPayroll(employeeId),
                apiService.getEmployeeProfile(employeeId)
            ]);
            setPayroll(Array.isArray(payrollData) ? payrollData : []);
            if (profileData?.ptkpStatus) {
                setEmployeePtkp(profileData.ptkpStatus);
            }
        } catch (error) {
            console.error('Failed to load payroll or profile:', error);
            setPayroll([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const generatePDF = async (item) => {
        const gross = (item.basicSalary || 0) + (item.overtime || 0) + (item.bonuses || 0);
        const deductions = (item.pph21 || 0) + (item.bpjsKetenagakerjaan || 0) + (item.bpjsKesehatan || 0) + (item.lateDeduction || 0) + (item.otherDeductions || 0);
        const net = item.netSalary || (gross - deductions);
        
        const monthName = new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long' });
        
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

                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { text-align: left; background: #F8FAFC; padding: 12px; font-size: 12px; border-bottom: 1px solid #E2E8F0; }
                    td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F1F5F9; }
                    .amount { text-align: right; }
                    
                    .summary-section { background: #F1F5F9; padding: 20px; border-radius: 8px; margin-top: 20px; }
                    .grand-total { font-size: 18px; font-weight: bold; color: #2D3748; display: flex; justify-content: space-between; align-items: center; }
                    .footer { margin-top: 60px; font-size: 12px; color: #718096; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <p class="company-name">PT. MAJU BERSAMA HRIS</p>
                    <p class="subtitle">Personal Salary Slip: ${monthName} ${item.year}</p>
                </div>

                <div class="info-section">
                    <div class="info-box">
                        <div class="info-label">Employee ID</div>
                        <div class="info-value">#${employeeId.substring(0, 8)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="info-label">Status</div>
                        <div class="info-value" style="color: #48BB78;">PAID</div>
                    </div>
                </div>

                <div style="display: flex; gap: 40px;">
                    <div style="flex: 1;">
                        <div class="payslip-title" style="text-align: left; font-size: 14px; border-left: 4px solid #4299E1; padding-left: 10px;">Earnings</div>
                        <table>
                            <tr><td>Basic Salary</td><td class="amount">Rp ${(item.basicSalary || 0).toLocaleString('id-ID')}</td></tr>
                            <tr><td>Overtime</td><td class="amount">Rp ${(item.overtime || 0).toLocaleString('id-ID')}</td></tr>
                            <tr><td>Bonuses</td><td class="amount">Rp ${(item.bonuses || 0).toLocaleString('id-ID')}</td></tr>
                            <tr style="font-weight: bold; background: #EDF2F7;"><td>Total Earnings</td><td class="amount">Rp ${gross.toLocaleString('id-ID')}</td></tr>
                        </table>
                    </div>
                    <div style="flex: 1;">
                        <div class="payslip-title" style="text-align: left; font-size: 14px; border-left: 4px solid #F56565; padding-left: 10px;">Deductions</div>
                        <table>
                            <tr><td>PPH21 Tax</td><td class="amount">Rp ${(item.pph21 || 0).toLocaleString('id-ID')}</td></tr>
                            <tr><td>BPJS TK</td><td class="amount">Rp ${(item.bpjsKetenagakerjaan || 0).toLocaleString('id-ID')}</td></tr>
                            <tr><td>BPJS Health</td><td class="amount">Rp ${(item.bpjsKesehatan || 0).toLocaleString('id-ID')}</td></tr>
                            <tr><td>Late/Other</td><td class="amount">Rp ${((item.lateDeduction || 0) + (item.otherDeductions || 0)).toLocaleString('id-ID')}</td></tr>
                            <tr style="font-weight: bold; background: #FED7D7;"><td>Total Deductions</td><td class="amount">Rp ${deductions.toLocaleString('id-ID')}</td></tr>
                        </table>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="grand-total">
                        <span>NET TAKE HOME PAY</span>
                        <span>Rp ${net.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Generated automatically via HR Mobile App. This is a computer-verified document.</p>
                </div>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('PDF Generation failed:', error);
        }
    };

    const totalEarning = payroll.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
    const currentYear = new Date().getFullYear();

    const DetailRow = ({ label, value, isNegative = false }) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, isNegative && { color: '#F56565' }]}>
                {isNegative ? '-' : ''}Rp {(value || 0).toLocaleString('id-ID')}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={20} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Payslips</Text>
                <TouchableOpacity onPress={loadPayroll}>
                    <Feather name="refresh-cw" size={20} color="#2D3748" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTop}>
                        <View style={styles.walletIconContainer}>
                            <Image source={Wallet} style={styles.walletIcon} />
                            <Text style={styles.summaryLabel}>Total Earnings</Text>
                        </View>
                        <View style={styles.yearBadge}>
                            <AntDesign name="calendar" size={14} color="#4A90E2" />
                            <Text style={styles.yearText}>{currentYear}</Text>
                        </View>
                    </View>
                    <Text style={styles.totalAmount}>Rp {totalEarning.toLocaleString('id-ID')}</Text>
                    <Text style={styles.summaryNote}>Cumulative earnings for the current year</Text>
                </View>

                <Text style={styles.sectionTitle}>Earning History</Text>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#4A90E2" />
                        <Text style={styles.loaderText}>Fetching records...</Text>
                    </View>
                ) : payroll.length > 0 ? (
                    payroll.map((item) => (
                        <View key={item.id} style={styles.payslipCard}>
                            <TouchableOpacity 
                                style={styles.cardHeader} 
                                onPress={() => toggleExpand(item.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.monthBox}>
                                    <Text style={styles.monthText}>
                                        {new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'short' })}
                                    </Text>
                                    <Text style={styles.yearSmallText}>{item.year}</Text>
                                </View>
                                <View style={styles.mainInfo}>
                                    <Text style={styles.itemTitle}>Monthly Salary</Text>
                                    <Text style={styles.itemDate}>Paid on {new Date(item.paymentDate).toLocaleDateString('id-ID')}</Text>
                                </View>
                                <View style={styles.amountInfo}>
                                    <Text style={styles.itemAmount}>Rp {(item.netSalary || 0).toLocaleString('id-ID')}</Text>
                                    <Ionicons 
                                        name={expandedId === item.id ? "chevron-up" : "chevron-down"} 
                                        size={18} 
                                        color="#718096" 
                                    />
                                </View>
                            </TouchableOpacity>

                            {expandedId === item.id && (
                                <View style={styles.expandedContent}>
                                    <View style={styles.divider} />
                                    
                                    <Text style={styles.subTitle}>Earnings</Text>
                                    <DetailRow label="Basic Salary" value={item.basicSalary} />
                                    <DetailRow label="Overtime (Lembur)" value={item.overtime} />
                                    <DetailRow label="Bonuses" value={item.bonuses} />
                                    
                                    <Text style={[styles.subTitle, { marginTop: 15 }]}>Deductions</Text>
                                    <DetailRow label="PPH21 (Income Tax)" value={item.pph21} isNegative />
                                    <DetailRow label="BPJS Ketenagakerjaan" value={item.bpjsKetenagakerjaan} isNegative />
                                    <DetailRow label="BPJS Kesehatan" value={item.bpjsKesehatan} isNegative />
                                    <DetailRow label="Potongan Telat" value={item.lateDeduction} isNegative />
                                    <DetailRow label="Others" value={item.otherDeductions} isNegative />
                                    
                                    <View style={styles.netBox}>
                                        <Text style={styles.netLabel}>NET SALARY</Text>
                                        <Text style={styles.netValue}>Rp {(item.netSalary || 0).toLocaleString('id-ID')}</Text>
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.downloadButton}
                                        onPress={() => generatePDF(item)}
                                    >
                                        <Ionicons name="download-outline" size={20} color="white" />
                                        <Text style={styles.downloadText}>Download PDF</Text>
                                    </TouchableOpacity>

                                    {/* Detailed Breakdown */}
                                    <View style={styles.breakdownCard}>
                                        <Text style={styles.breakdownTitle}>How this was calculated (TER 2024)</Text>
                                        {(() => {
                                            const gross = (item.basicSalary || 0) + (item.overtime || 0) + (item.bonuses || 0);
                                            const auto = calculatePayrollAutomation(gross, employeePtkp);
                                            return (
                                                <View>
                                                    <View style={styles.breakdownRow}>
                                                        <Text style={styles.breakdownSub}>Tax Status:</Text>
                                                        <Text style={styles.breakdownValue}>{TAX_STATUS[employeePtkp] || employeePtkp}</Text>
                                                    </View>
                                                    <View style={styles.breakdownRow}>
                                                        <Text style={styles.breakdownSub}>PPH21 Tax Rate:</Text>
                                                        <Text style={styles.breakdownValue}>{auto.rate}% (Cat {auto.category})</Text>
                                                    </View>
                                                    <View style={styles.breakdownRow}>
                                                        <Text style={styles.breakdownSub}>BPJS Health:</Text>
                                                        <Text style={styles.breakdownValue}>1% (Cap Applied)</Text>
                                                    </View>
                                                    <View style={styles.breakdownRow}>
                                                        <Text style={styles.breakdownSub}>BPJS TK:</Text>
                                                        <Text style={styles.breakdownValue}>2% JHT + 1% JP</Text>
                                                    </View>
                                                </View>
                                            );
                                        })()}
                                    </View>
                                </View>
                            )}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="file-search-outline" size={60} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No payroll history found yet.</Text>
                    </View>
                )}
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
    },
    backButton: {
        backgroundColor: '#4A90E2',
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    scrollContent: {
        padding: 20,
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#EBF8FF',
    },
    summaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    walletIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    walletIcon: {
        width: 32,
        height: 32,
        marginRight: 10,
    },
    summaryLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A90E2',
    },
    yearBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    yearText: {
        marginLeft: 5,
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: '900',
        color: '#2D3748',
        marginVertical: 10,
    },
    summaryNote: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 15,
    },
    payslipCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    monthBox: {
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        width: 60,
    },
    monthText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    yearSmallText: {
        fontSize: 10,
        color: '#718096',
    },
    mainInfo: {
        flex: 1,
        marginLeft: 15,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    itemDate: {
        fontSize: 12,
        color: '#A0AEC0',
        marginTop: 2,
    },
    amountInfo: {
        alignItems: 'flex-end',
    },
    itemAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 4,
    },
    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 15,
    },
    subTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4A5568',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#718096',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
    },
    netBox: {
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    netLabel: {
        fontSize: 15,
        fontWeight: '900',
        color: '#2D3748',
    },
    netValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#4A90E2',
    },
    loaderContainer: {
        padding: 50,
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        color: '#718096',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 15,
        color: '#CBD5E0',
        fontSize: 16,
    },
    breakdownCard: {
        marginTop: 15,
        backgroundColor: '#EBF8FF',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#BEE3F8',
    },
    breakdownTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2B6CB0',
        marginBottom: 8,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    breakdownSub: {
        fontSize: 11,
        color: '#4A5568',
    },
    breakdownValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#2B6CB0',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2D3748',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    downloadText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
});

export default PaySlip;