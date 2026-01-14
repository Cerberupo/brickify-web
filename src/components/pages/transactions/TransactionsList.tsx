import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getTransactions} from '@/lib/services/stripe';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import {ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Coins, History} from 'lucide-react';
import {format} from 'date-fns';
import {useAuthContext} from "@/lib/stores/authStore";

export function TransactionsList() {
    const {t, i18n} = useTranslation();
    const {user} = useAuthContext();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadTransactions();
    }, [page]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const result = await getTransactions(page, 10);
            setData(result);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    const {transactions = [], pagination = {pages: 0, total: 0}} = data || {};

    return (
        <div className="container mx-auto py-10 px-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <CardTitle className="text-2xl font-bold flex items-center">
                        <History className="mr-2 h-6 w-6"/>
                        {t('transactions.title', {defaultValue: 'My Transactions'})}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        <Coins className="h-5 w-5 text-yellow-500"/>
                        <span
                            className="text-lg font-semibold">{t('transactions.total_balance', {defaultValue: 'Balance'})}: {user?.balance || 0}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('transactions.date', {defaultValue: 'Date'})}</TableHead>
                                <TableHead>{t('transactions.description', {defaultValue: 'Description'})}</TableHead>
                                <TableHead>{t('transactions.type', {defaultValue: 'Type'})}</TableHead>
                                <TableHead
                                    className="text-right">{t('transactions.amount', {defaultValue: 'Amount'})}</TableHead>
                                <TableHead
                                    className="text-right">{t('transactions.status', {defaultValue: 'Status'})}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        {t('transactions.no_transactions', {defaultValue: 'No transactions found'})}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx: any) => (
                                    <TableRow key={tx._id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            {tx.description}
                                            {tx.group && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Group ID: {tx.group}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                {tx.type === 'recharge' ? (
                                                    <ArrowUpRight className="mr-1 h-4 w-4 text-green-500"/>
                                                ) : (
                                                    <ArrowDownLeft className="mr-1 h-4 w-4 text-red-500"/>
                                                )}
                                                <span className="capitalize">
                            {tx.type === 'recharge' ? t('transactions.type_recharge', {defaultValue: 'Recharge'}) : t('transactions.type_spend', {defaultValue: 'Spend'})}
                        </span>
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                        </TableCell>
                                        <TableCell className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                              tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {t(`transactions.status_${tx.status}`, {defaultValue: tx.status})}
                      </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4"/>
                                {t('common.previous', {defaultValue: 'Previous'})}
                            </Button>
                            <div className="text-sm font-medium">
                                {t('common.page_of', {
                                    defaultValue: 'Page {{page}} of {{pages}}',
                                    page,
                                    pages: pagination.pages
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages || loading}
                            >
                                {t('common.next', {defaultValue: 'Next'})}
                                <ChevronRight className="h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

