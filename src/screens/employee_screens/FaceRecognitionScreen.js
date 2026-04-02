import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Animated, Easing, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../../../config';

export default function FaceRecognitionScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useSelector(state => state.auth);
    const [permission, requestPermission] = useCameraPermissions();
    const [photos, setPhotos] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const cameraRef = useRef(null);
    const scanAnim = useRef(new Animated.Value(0)).current;
    const guideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const guideLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(guideAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(guideAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        );
        guideLoop.start();
        return () => guideLoop.stop();
    }, [guideAnim, photos.length]);

    const getGuideTransform = () => {
        const step = photos.length;
        if (mode === 'attendance' || step === 0) {
            return [{ scale: guideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }];
        }
        if (step === 1) { 
            return [{ rotateY: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '50deg'] }) }];
        }
        if (step === 2) { 
            return [{ rotateY: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-50deg'] }) }];
        }
        if (step === 3) { 
            return [{ rotateX: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }];
        }
        if (step === 4) { 
            return [{ rotateX: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] }) }];
        }
        return [];
    };

    // Removed getGuideIcon 

    useEffect(() => {
        const loopAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ])
        );
        loopAnimation.start();
        return () => loopAnimation.stop();
    }, [scanAnim]);

    const scannerTranslateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 250]
    });

    const mode = route.params?.mode || 'attendance';
    const MAX_TAKES = mode === 'registration' ? 5 : 1;

    const registrationDirections = [
        "Lurus menghadap ke depan",
        "Tengok sedikit ke kanan",
        "Tengok sedikit ke kiri",
        "Sedikit mendongak ke atas",
        "Sedikit menunduk ke bawah"
    ];

    const getDirectionText = () => {
        if (photos.length >= MAX_TAKES) return "Memproses data wajah...";
        if (mode === 'attendance') return "Mohon posisikan wajah lurus ke kamera";
        return `Posisi ${photos.length + 1}/5: ${registrationDirections[photos.length]}`;
    };

// API_BASE_URL is imported from config.js

    if (!permission) {
        return <View style={styles.container}><ActivityIndicator size="large" color="#00a2e4" /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera for Face Recognition.</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current && photos.length < MAX_TAKES && !isProcessing) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                const newPhotos = [...photos, photo.uri];
                setPhotos(newPhotos);

                if (newPhotos.length === MAX_TAKES) {
                    processPhotos(newPhotos);
                }
            } catch (error) {
                Alert.alert("Error", "Gagal mengambil gambar.");
            }
        }
    };

    const processPhotos = async (capturedPhotos) => {
        setIsProcessing(true);
        try {
            const employeeId = user?.user?.employeeId || user?.user?.id || route.params?.employeeId;
            
            if (!employeeId) {
                Alert.alert("Error", "ID Karyawan tidak ditemukan. Silakan login ulang.");
                setIsProcessing(false);
                return;
            }
            
            if (mode === 'registration') {
                let successCount = 0;
                for (let uri of capturedPhotos) {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: uri,
                        name: 'photo.jpg',
                        type: 'image/jpeg',
                    });
                    formData.append('employeeId', employeeId.toString());
                    
                    const response = await fetch(`${API_BASE_URL}/face-recognition/register`, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log("DEBUG: Registration Response:", data);
                        if (data.status === 'success') successCount++;
                    }
                }
                
                if (successCount > 0) {
                    Alert.alert("Success!", `Pendaftaran Wajah Berhasil (${successCount}/5 sampel tersimpan).`, [
                        { text: "OK", onPress: () => navigation.goBack() }
                    ]);
                } else {
                    Alert.alert("Failed", "Wajah gagal didaftarkan atau tidak terdeteksi dengan jelas oleh sistem.");
                }
            } else {
                // Attendance Mode
                const formData = new FormData();
                formData.append('file', {
                    uri: capturedPhotos[0],
                    name: 'photo.jpg',
                    type: 'image/jpeg',
                });
                
                const response = await fetch(`${API_BASE_URL}/face-recognition/recognize`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.recognized) {
                        Alert.alert("Success!", `Absen Berhasil. Halo, ${data.name}! (Kecocokan: ${data.similarity})`, [
                            { text: "OK", onPress: () => navigation.goBack() }
                        ]);
                    } else {
                        Alert.alert("Unknown", "Wajah tidak dikenali atau belum terdaftar di sistem.");
                    }
                } else {
                    Alert.alert("Error", "Gagal mengenali wajah, coba lagi.");
                }
            }
        } catch (error) {
            console.error("API Error:", error);
            Alert.alert("Failed", "Koneksi ke server face recognition (API) gagal. Pastikan server nyala dan IP benar.");
        } finally {
            setIsProcessing(false);
            setPhotos([]); // Reset array foto
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Face Recognition</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    {getDirectionText()}
                </Text>
                <View style={styles.progressContainer}>
                    {[...Array(MAX_TAKES)].map((_, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.progressDot, 
                                { backgroundColor: index < photos.length ? '#00a2e4' : '#e0e0e0' }
                            ]} 
                        />
                    ))}
                </View>
            </View>

            <CameraView 
                style={styles.camera} 
                facing="front" 
                ref={cameraRef}
            >
                <View style={styles.scanOverlay}>
                    <View style={styles.scanBox}>
                        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scannerTranslateY }] }]} />
                    </View>
                    
                    {/* Directional Overlay on Camera */}
                    {photos.length < MAX_TAKES && !isProcessing && (
                        <Animated.View style={[styles.centerDirectionOverlay, { transform: getGuideTransform() }]}>
                            <Image 
                                source={{ uri: 'https://img.icons8.com/ios/400/ffffff/face-id.png' }}
                                style={styles.professionalHead}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    )}
                </View>
                {isProcessing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.loadingText}>Menganalisa Wajah...</Text>
                    </View>
                )}
            </CameraView>

            <View style={styles.bottomContainer}>
                <TouchableOpacity 
                    style={[
                        styles.captureButton, 
                        (isProcessing || photos.length >= MAX_TAKES) && styles.captureButtonDisabled
                    ]} 
                    disabled={isProcessing || photos.length >= MAX_TAKES}
                    onPress={takePicture}
                >
                    <Ionicons name="camera" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.captureHint}>
                    Tekan untuk mengambil foto wajah
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    backButton: {
        padding: 5,
    },
    message: {
        textAlign: 'center',
        fontSize: 16,
        padding: 20,
        marginTop: 50,
    },
    permissionButton: {
        backgroundColor: '#00a2e4',
        padding: 15,
        marginHorizontal: 40,
        borderRadius: 8,
        alignItems: 'center',
    },
    permissionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    infoContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    infoText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    camera: {
        flex: 1,
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerDirectionOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    professionalHead: {
        width: 180,
        height: 180,
        tintColor: 'rgba(255, 255, 255, 0.9)',
    },
    scanBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#00a2e4',
        borderRadius: 20,
        overflow: 'hidden',
    },
    scanLine: {
        width: '100%',
        height: 3,
        backgroundColor: '#00a2e4',
        shadowColor: '#00a2e4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 5,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomContainer: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#00a2e4',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        marginBottom: 10,
    },
    captureButtonDisabled: {
        backgroundColor: '#a0d1e6',
    },
    captureHint: {
        color: '#666',
        fontSize: 14,
    }
});
