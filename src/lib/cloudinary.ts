const CLOUD_NAME = 'dvng4f0nj';
const UPLOAD_PRESET = 'Ali-Academy-Preset';


// console.log("Hello : " , process.env.EXPO_CLOUD_NAME)
// console.log("Hello : " , process.env.EXPO_UPLOAD_PRESET)

export async function uploadToCloudinary(file: {
  uri: string;
  name?: string;
  mimeType?: string;
}): Promise<string> {
  try {
    console.log('Starting upload with file:', {
      name: file.name,
      type: file.mimeType,
      uri: file.uri,
    });

    // Validate configuration
    if (!CLOUD_NAME) {
      throw new Error(
        'SETUP REQUIRED: Go to cloudinary.com, get your cloud name, and replace CLOUD_NAME.'
      );
    }

    if (!UPLOAD_PRESET) {
      throw new Error(
        'SETUP REQUIRED: Create an unsigned upload preset in Cloudinary and replace UPLOAD_PRESET.'
      );
    }

    // Validate file
    if (!file || !file.uri) {
      throw new Error('No valid file provided');
    }

    const formData = new FormData();

    // React Native-compatible file object
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'application/octet-stream',
      name: file.name || 'upload.pdf',
    } as any);

    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', 'raw');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
    console.log('Upload URL:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary error response:', errorText);

      if (response.status === 400) {
        throw new Error('Invalid file or configuration. Check your Cloudinary settings.');
      } else if (response.status === 401) {
        throw new Error('Upload not authorized. Check your upload preset settings.');
      } else {
        throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    console.log("HELLO DATA : ", data)
    console.log('Upload successful:', data.secure_url);

    if (!data.secure_url) {
      throw new Error('No URL returned from Cloudinary');
    }

    return data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

