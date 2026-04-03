import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import { AntDesign, EvilIcons } from '@expo/vector-icons';
import { Wallet } from '../../../assets/index';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';

const PaySlip = () => {
    const navigation = useNavigation();
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);
    const employeeId = useSelector(state => state.auth.user?.user?.employeeId);

    useEffect(() => {
        if (employeeId) {
            loadPayroll();
        }
    }, [employeeId]);

    const loadPayroll = async () => {
        try {
            setLoading(true);
            const data = await apiService.getPayroll(employeeId);
            if (Array.isArray(data)) {
                setPayroll(data);
            } else {
                setPayroll([]);
            }
        } catch (error) {
            console.error('Failed to load payroll:', error);
            setPayroll([]);
        } finally {
            setLoading(false);
        }
    };

    const validatedPayroll = Array.isArray(payroll) ? payroll : [];
    const totalEarning = validatedPayroll.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
    const currentYear = new Date().getFullYear();

    return (
        <ScrollView className="pt-12 px-5 bg-blue-50 h-full">
            <View className="flex-row items-center">
                <TouchableOpacity className="p-1 bg-blue-400 w-7 rounded-md" onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={18} color="white" />
                </TouchableOpacity>
                <Text className="text-center w-[85%] font-semibold text-[18px]">Salary PaySlip</Text>
            </View>
            {/* ---------------------------------------- -----------------------------*/}
            <View className="bg-white rounded-lg px-3 py-2 mt-8 flex-row items-center justify-between">
                <View className="">
                    <View className="flex-row items-center space-x-1">
                        <Image
                            source={Wallet}
                            className="h-8 w-8 object-cover"
                        />
                        <Text className="text-[17px] font-medium text-[#00a2e4]">Total</Text>
                    </View>
                    <View className="py-1">
                        <Text className="text-[22px] pl-1.5 font-semibold text-[#00a2e4]">
                            ${totalEarning.toLocaleString()}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center space-x-5 py-2 px-3 rounded-lg bg-blue-50">
                    <View className="flex-row">
                        <EvilIcons name="calendar" size={24} color={"#00a2e4"} />
                        <Text className="font-medium text-[#00a2e4] mt-[1px]">{currentYear}</Text>
                    </View>
                    <AntDesign name="down" size={15} color="#00a2e4" />
                </View>
            </View>
            {/* ---------------------------------------- -----------------------------*/}
            <SafeAreaView>
                <Text className="py-5 font-semibold text-[17px]">Earning History</Text>
                <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] text-gray-500 font-medium">Month/Year</Text>
                    <Text className="text-[13px] text-gray-500 font-medium">Amount</Text>
                </View>
                {loading ? (
                    <ActivityIndicator size="small" color="#00a2e4" className="mt-10" />
                ) : (
                    validatedPayroll && validatedPayroll.length > 0 ? (
                        validatedPayroll.map((list) => (
                            <View className="flex-row items-center justify-between py-4 border-b border-gray-300" key={list.id}>
                                <Text className="text-[16px] font-medium">{list.month}/{list.year}</Text>
                                <Text className="text-[16px] font-medium">${(list.netSalary || 0).toLocaleString()}</Text>
                            </View>
                        ))
                    ) : (
                        <View className="mt-10 items-center">
                            <Text className="text-gray-500">No payroll history found.</Text>
                        </View>
                    )
                )}
            </SafeAreaView>
        </ScrollView>
    )
}

export default PaySlip;