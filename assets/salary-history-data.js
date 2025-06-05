// File lưu trữ lịch sử tính lương - NovaVision
// Mỗi lần xuất kết quả, copy dữ liệu và paste vào mảng historyData bên dưới

const salaryHistoryData = [
    {
        "totalRevenue": 1000000,
        "totalExpenses": 0,
        "netProfit": 1000000,
        "members": [
            {
                "id": 1749132300836,
                "name": "Nhân",
                "percentage": 10,
                "expenses": 0,
                "salary": 100000
            },
            {
                "id": 1749132300837,
                "name": "Liên",
                "percentage": 10,
                "expenses": 0,
                "salary": 100000
            },
            {
                "id": 1749132300839,
                "name": "Nguyên",
                "percentage": 45,
                "expenses": 0,
                "salary": 450000
            },
            {
                "id": 1749132738673,
                "name": "Ngân",
                "percentage": 35,
                "expenses": 0,
                "salary": 350000
            }
        ],
        "calculatedAt": "2025-05-05T14:23:07.013Z",
        "exportedAt": "2025-05-05T14:23:10.842Z"
    },
    {
        "totalRevenue": 10000000,
        "totalExpenses": 100000,
        "netProfit": 9900000,
        "expensePerPerson": 25000,
        "members": [
            {
                "id": 1749132300836,
                "name": "Nhân",
                "percentage": 10,
                "expenses": 100000,
                "salary": 1090000,
                "salaryFromRevenue": 1000000,
                "salaryFromProfit": 990000,
                "expensePerPerson": 25000
            },
            {
                "id": 1749132300837,
                "name": "Liên",
                "percentage": 10,
                "expenses": 0,
                "salary": 990000,
                "salaryFromRevenue": 1000000,
                "salaryFromProfit": 990000,
                "expensePerPerson": 25000
            },
            {
                "id": 1749132300839,
                "name": "Nguyên",
                "percentage": 45,
                "expenses": 0,
                "salary": 4455000,
                "salaryFromRevenue": 4500000,
                "salaryFromProfit": 4455000,
                "expensePerPerson": 25000
            },
            {
                "id": 1749132738673,
                "name": "Ngân",
                "percentage": 35,
                "expenses": 0,
                "salary": 3465000,
                "salaryFromRevenue": 3500000,
                "salaryFromProfit": 3465000,
                "expensePerPerson": 25000
            }
        ],
        "calculatedAt": "2025-06-05T15:54:28.047Z",
        "exportedAt": "2025-06-05T15:54:29.358Z"
    }
];

// Xuất dữ liệu để app có thể sử dụng
if (typeof window !== 'undefined') {
    window.salaryHistoryData = salaryHistoryData;
}
