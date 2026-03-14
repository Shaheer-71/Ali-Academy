import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Upload, FileText, Video, Image, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

interface FileUploaderProps {
  onFileSelect: (file: any) => void;
  selectedFile?: any;
  acceptedTypes?: string[];
  label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  selectedFile,
  acceptedTypes = ['application/pdf', 'video/*', 'image/*'],
  label = "Select File",
}) => {
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        onFileSelect(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload size={20} color="#204040" />;

    if (selectedFile.mimeType?.includes('video')) {
      return <Video size={20} color="#8B5CF6" />;
    }
    if (selectedFile.mimeType?.includes('image')) {
      return <Image size={20} color="#10B981" />;
    }
    return <FileText size={20} color="#204040" />;
  };

  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      <Text allowFontScaling={false} style={styles.label}>{label}</Text>

      {selectedFile ? (
        <View style={styles.selectedFileContainer}>
          <View style={styles.fileInfo}>
            {getFileIcon()}
            <View style={styles.fileDetails}>
              <Text allowFontScaling={false} style={styles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text allowFontScaling={false} style={styles.fileSize}>
                {getFileSize(selectedFile.size)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onFileSelect(null)}
          >
            <X size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickDocument}
          disabled={uploading}
        >
          <Upload size={20} color="#204040" />
          <Text allowFontScaling={false} style={styles.uploadText}>
            {uploading ? 'Selecting...' : 'Select File'}
          </Text>
        </TouchableOpacity>
      )}

      <Text allowFontScaling={false} style={styles.supportedFormats}>
        Supported: PDF, Images, Videos
      </Text>
    </View>
  );
};

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    gap: 8,
  },
  uploadText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Medium',
    color: '#204040',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: TextSizes.large,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  removeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportedFormats: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
});

// const styles = StyleSheet.create({
//   container: {
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 14,
//     fontFamily: 'Inter-Medium',
//     color: '#374151',
//     marginBottom: 8,
//   },
//   uploadButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#F9FAFB',
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     borderStyle: 'dashed',
//     borderRadius: 8,
//     paddingVertical: 20,
//     gap: 8,
//   },
//   uploadText: {
//     fontSize: 14,
//     fontFamily: 'Inter-Medium',
//     color: '#204040',
//   },
//   selectedFileContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#F9FAFB',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 8,
//     padding: 12,
//   },
//   fileInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   fileDetails: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   fileName: {
//     fontSize: 14,
//     fontFamily: 'Inter-Medium',
//     color: '#111827',
//     marginBottom: 2,
//   },
//   fileSize: {
//     fontSize: 12,
//     fontFamily: 'Inter-Regular',
//     color: '#6B7280',
//   },
//   removeButton: {
//     width: 24,
//     height: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   supportedFormats: {
//     fontSize: 11,
//     fontFamily: 'Inter-Regular',
//     color: '#9CA3AF',
//     marginTop: 6,
//     textAlign: 'center',
//   },
// });