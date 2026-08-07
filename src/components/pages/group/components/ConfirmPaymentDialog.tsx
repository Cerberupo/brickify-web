import React from 'react';
import {useTranslation} from 'react-i18next';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Alert,
    AlertDescription,
    AlertTitle,
    Button,
} from '@/components/ui';
import {AlertTriangle, Coins} from 'lucide-react';

interface ConfirmPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isProcessing: boolean;
    totalMembers: number;
    costPerMember: number;
    totalCost: number;
    currentBalance: number;
    onboardingActive?: boolean;
}

export function ConfirmPaymentDialog({
                                         open,
                                         onOpenChange,
                                         onConfirm,
                                         isProcessing,
                                         totalMembers,
                                         costPerMember,
                                         totalCost,
                                         currentBalance,
                                         onboardingActive,
                                     }: ConfirmPaymentDialogProps) {
    const {t} = useTranslation();
    const remainingBalance = currentBalance - totalCost;

    return (
        <AlertDialog modal={!onboardingActive} open={open} onOpenChange={(nextOpen) => {
            if (isProcessing) return;
            onOpenChange(nextOpen);
        }}>
            <AlertDialogContent
                className="max-w-md"
                id="tour-confirm-payment-dialog"
                onPointerDownOutside={(e) => onboardingActive && e.preventDefault()}
                onInteractOutside={(e) => onboardingActive && e.preventDefault()}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('checkout.confirm_payment.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('checkout.confirm_payment.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="bg-muted/50 rounded-lg p-4 my-4 space-y-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        {t('checkout.confirm_payment.summary')}
                    </h4>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{t('checkout.confirm_payment.members')}</span>
                            <span className="font-medium">{totalMembers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>{t('checkout.confirm_payment.cost_per_member')}</span>
                            <div className="flex items-center font-medium">
                                <Coins className="h-3.5 w-3.5 mr-1 text-yellow-500"/>
                                {costPerMember}
                            </div>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                            <span>{t('checkout.confirm_payment.total_cost')}</span>
                            <div className="flex items-center text-primary">
                                <Coins className="h-4 w-4 mr-1 text-yellow-500"/>
                                {totalCost}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-dashed pt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t('checkout.confirm_payment.current_balance')}</span>
                            <div className="flex items-center">
                                <Coins className="h-3 w-3 mr-1"/>
                                {currentBalance}
                            </div>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                            <span>{t('checkout.confirm_payment.remaining_balance')}</span>
                            <div className={`flex items-center ${remainingBalance < 0 ? 'text-red-500' : ''}`}>
                                <Coins className="h-3 w-3 mr-1"/>
                                {remainingBalance}
                            </div>
                        </div>
                    </div>
                </div>

                <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>{t('checkout.confirm_payment.person_only_warning_title')}</AlertTitle>
                    <AlertDescription className="text-amber-900">
                        {t('checkout.confirm_payment.person_only_warning')}
                    </AlertDescription>
                </Alert>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isProcessing}>
                        {t('checkout.confirm_payment.cancel')}
                    </AlertDialogCancel>
                    <Button
                        onClick={onConfirm}
                        disabled={isProcessing || remainingBalance < 0}
                        isLoading={isProcessing}
                        className="min-w-[120px]"
                    >
                        {t('checkout.confirm_payment.confirm')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ConfirmPaymentDialog;
