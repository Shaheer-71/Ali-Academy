import { Text, TextInput } from 'react-native';

// Disable font scaling globally so device text size settings don't affect the app
(Text as any).defaultProps = (Text as any).defaultProps ?? {};
(Text as any).defaultProps.allowFontScaling = false;

(TextInput as any).defaultProps = (TextInput as any).defaultProps ?? {};
(TextInput as any).defaultProps.allowFontScaling = false;
