document.addEventListener('DOMContentLoaded', function() {
    // تهيئة البيانات إذا لم تكن موجودة
    if (!localStorage.getItem('transactions')) {
        const sampleTransactions = [
            {
                id: 1,
                type: 'income',
                amount: 5000,
                category: 'salary',
                note: 'راتب الشهر',
                date: new Date().toISOString()
            },
            {
                id: 2,
                type: 'expense',
                amount: 1500,
                category: 'bills',
                note: 'فاتورة الكهرباء',
                date: new Date().toISOString()
            },
            {
                id: 3,
                type: 'expense',
                amount: 800,
                category: 'food',
                note: 'بقالة الأسبوع',
                date: new Date().toISOString()
            }
        ];
        localStorage.setItem('transactions', JSON.stringify(sampleTransactions));
    }

    if (!localStorage.getItem('debts')) {
        localStorage.setItem('debts', JSON.stringify([]));
    }

    // تحميل البيانات
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const debts = JSON.parse(localStorage.getItem('debts')) || [];

    // عناصر DOM
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    // فتح/إغلاق النموذج المنبثق
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', function() {
            transactionModal.classList.add('active');
            document.getElementById('transaction-date').valueAsDate = new Date();
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });

    // إضافة معاملة جديدة
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const type = document.getElementById('transaction-type').value;
            const amount = parseFloat(document.getElementById('transaction-amount').value);
            const category = document.getElementById('transaction-category').value;
            const note = document.getElementById('transaction-note').value;
            const date = document.getElementById('transaction-date').value;
            
            if (!type || !amount || isNaN(amount) || !category || !date) {
                alert('الرجاء إدخال جميع البيانات المطلوبة');
                return;
            }
            
            const newTransaction = {
                id: Date.now(),
                type,
                amount,
                category,
                note,
                date: new Date(date).toISOString()
            };
            
            const updatedTransactions = [newTransaction, ...transactions];
            localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
            
            updateStats();
            renderRecentTransactions();
            renderMonthlyChart();
            renderExpenseChart();
            
            transactionForm.reset();
            transactionModal.classList.remove('active');
            
            // إظهار رسالة نجاح
            showAlert('تم إضافة المعاملة بنجاح', 'success');
        });
    }

    // تحديث الإحصائيات
    function updateStats() {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const debts = JSON.parse(localStorage.getItem('debts')) || [];
        
        const totalIncome = transactions.reduce((total, trx) => {
            return trx.type === 'income' ? total + parseFloat(trx.amount) : total;
        }, 0);

        const totalExpense = transactions.reduce((total, trx) => {
            return trx.type === 'expense' ? total + parseFloat(trx.amount) : total;
        }, 0);

        const currentBalance = totalIncome - totalExpense;
        const totalOwed = debts.reduce((total, debt) => {
            return debt.type === 'owed' ? total + parseFloat(debt.amount) : total;
        }, 0);

        // تحديث العناصر
        if (document.getElementById('total-income')) {
            document.getElementById('total-income').textContent = formatCurrency(totalIncome);
        }
        if (document.getElementById('total-expense')) {
            document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
        }
        if (document.getElementById('current-balance')) {
            document.getElementById('current-balance').textContent = formatCurrency(currentBalance);
            document.getElementById('current-balance').style.color = currentBalance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
        }
        if (document.getElementById('total-debts')) {
            document.getElementById('total-debts').textContent = formatCurrency(totalOwed);
        }
    }

    // عرض أحدث المعاملات
    function renderRecentTransactions() {
        const container = document.getElementById('recent-transactions');
        if (!container) return;

        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<div class="no-transactions">لا توجد معاملات حديثة</div>';
            return;
        }

        container.innerHTML = '';
        recent.forEach(trx => {
            const item = document.createElement('div');
            item.className = `transaction-item ${trx.type}`;
            item.innerHTML = `
                <div class="transaction-icon">
                    <i class="fas ${trx.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${trx.note || 'بدون وصف'}</div>
                    <span class="transaction-category">${getCategoryName(trx.category)}</span>
                    <div class="transaction-date">${formatDate(trx.date)}</div>
                </div>
                <div class="transaction-amount">
                    ${formatCurrency(trx.amount)}
                </div>
            `;
            container.appendChild(item);
        });
    }

    // عرض المخطط الشهري
    function renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        // تجميع البيانات الشهرية
        const monthlyData = Array(12).fill().map(() => ({ income: 0, expense: 0 }));
        
        transactions.forEach(trx => {
            const date = new Date(trx.date);
            const month = date.getMonth();
            
            if (trx.type === 'income') {
                monthlyData[month].income += parseFloat(trx.amount);
            } else {
                monthlyData[month].expense += parseFloat(trx.amount);
            }
        });

        // إزالة المخطط القديم إذا كان موجوداً
        if (window.monthlyChart) {
            window.monthlyChart.destroy();
        }

        window.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'مدخول',
                        data: monthlyData.map(m => m.income),
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'مصروف',
                        data: monthlyData.map(m => m.expense),
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value, true);
                            }
                        },
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // عرض مخطط المصروفات
    function renderExpenseChart() {
        const container = document.getElementById('expenseChart');
        if (!container) return;

        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const expenseCategories = {
            'food': 'طعام',
            'transport': 'مواصلات',
            'bills': 'فواتير',
            'shopping': 'تسوق',
            'other-expense': 'أخرى'
        };
        
        // تجميع المصروفات حسب الفئة
        const categoryData = {};
        Object.keys(expenseCategories).forEach(cat => {
            categoryData[cat] = 0;
        });
        
        transactions.forEach(trx => {
            if (trx.type === 'expense') {
                const category = trx.category in expenseCategories ? trx.category : 'other-expense';
                categoryData[category] += parseFloat(trx.amount);
            }
        });
        
        // تحويل البيانات
