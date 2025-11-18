import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { Settings, CircleEllipsis, Moon } from 'lucide-react-native';

export default function TopSection() {
    const route = useRoute();
    const screenName = route.name.charAt(0).toUpperCase() + route.name.slice(1);

    return (
        <SafeAreaView style={{ backgroundColor: "#fff" }} edges={['top', 'left', 'right']}>
            <View style={{ paddingHorizontal: 12, marginHorizontal: 12, justifyContent: "space-between", flexDirection: "row", paddingVertical: 5, marginVertical: 5, marginRight: "5%" }}>
                <Text allowFontScaling={false} style={{ fontWeight: "bold", color: "#204040", fontSize: 28, fontFamily: 'Inter-SemiBold' }}>{screenName === "Index" ? "Home" : screenName || 'Untitled'}</Text>
                {/* <TouchableOpacity>
                    <CircleEllipsis color="#204040" size={24} />
                </TouchableOpacity> */}

                <View style={{ flexDirection: "row", width: "23%", justifyContent: "space-between" }}>
                    <TouchableOpacity style={{ alignItems: "center" }}>
                        <Moon color="#204040" size={30} />
                    </TouchableOpacity>
                    {/* 
                    {
                        screenName === "Settings" ? null : */}
                    <TouchableOpacity style={{ alignItems: "center" }}>
                        <Settings color="#204040" size={30} />
                    </TouchableOpacity>
                    {/* } */}

                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
})