import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type DialogType = 'error' | 'success' | 'confirm' | 'warning' | 'info';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface AlertOptions {
    title: string;
    message: string;
    onClose?: () => void;
}

interface DialogState {
    visible: boolean;
    type: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm?: () => void;
    onClose?: () => void;
}

interface DialogContextType {
    showError: (title: string, message: string, onClose?: () => void) => void;
    showSuccess: (title: string, message: string, onClose?: () => void) => void;
    showWarning: (title: string, message: string, onClose?: () => void) => void;
    showInfo: (title: string, message: string, onClose?: () => void) => void;
    showConfirm: (options: ConfirmOptions) => void;
    hide: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

const INITIAL: DialogState = {
    visible: false,
    type: 'info',
    title: '',
    message: '',
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dialog, setDialog] = useState<DialogState>(INITIAL);
    const [cancelFn, setCancelFn] = useState<(() => void) | undefined>(undefined);

    const hide = useCallback(() => {
        setDialog(prev => ({ ...prev, visible: false }));
    }, []);

    const showError = useCallback((title: string, message: string, onClose?: () => void) => {
        setDialog({ visible: true, type: 'error', title, message, onClose });
    }, []);

    const showSuccess = useCallback((title: string, message: string, onClose?: () => void) => {
        setDialog({ visible: true, type: 'success', title, message, onClose });
    }, []);

    const showWarning = useCallback((title: string, message: string, onClose?: () => void) => {
        setDialog({ visible: true, type: 'warning', title, message, onClose });
    }, []);

    const showInfo = useCallback((title: string, message: string, onClose?: () => void) => {
        setDialog({ visible: true, type: 'info', title, message, onClose });
    }, []);

    const showConfirm = useCallback((options: ConfirmOptions) => {
        setCancelFn(() => options.onCancel);
        setDialog({
            visible: true,
            type: 'confirm',
            title: options.title,
            message: options.message,
            confirmText: options.confirmText ?? 'Confirm',
            cancelText: options.cancelText ?? 'Cancel',
            destructive: options.destructive ?? false,
            onConfirm: options.onConfirm,
        });
    }, []);

    return (
        <DialogContext.Provider value={{ showError, showSuccess, showWarning, showInfo, showConfirm, hide }}>
            {children}
            <AppDialogRenderer dialog={dialog} hide={hide} cancelFn={cancelFn} />
        </DialogContext.Provider>
    );
};

export const useDialog = () => {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error('useDialog must be used within DialogProvider');
    return ctx;
};

// ── Renderer (imported here to keep everything in one file) ──────────────────
import { AppDialog } from '@/src/components/common/AppDialog';

const AppDialogRenderer = ({
    dialog,
    hide,
    cancelFn,
}: {
    dialog: DialogState;
    hide: () => void;
    cancelFn?: () => void;
}) => {
    const handleClose = () => {
        hide();
        dialog.onClose?.();
    };

    const handleConfirm = () => {
        hide();
        dialog.onConfirm?.();
    };

    const handleCancel = () => {
        hide();
        cancelFn?.();
    };

    return (
        <AppDialog
            visible={dialog.visible}
            type={dialog.type}
            title={dialog.title}
            message={dialog.message}
            confirmText={dialog.confirmText}
            cancelText={dialog.cancelText}
            destructive={dialog.destructive}
            onClose={handleClose}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );
};
