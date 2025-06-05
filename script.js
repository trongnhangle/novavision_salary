class SalaryCalculator {
    constructor() {
        this.members = [];
        this.results = null;
        this.cacheKey = 'novavision_salary_cache';
        this.devModeKey = 'novavision_salary_dev_mode';
        this.clickCount = 0;
        this.clickTimeout = null;
        this.isDevMode = false;
        this.init();
    }

    init() {
        // Kiểm tra shared data trước
        if (this.checkForSharedData()) {
            return; // Nếu có shared data, dừng khởi tạo bình thường
        }

        // Load cache và dev mode trước khi khởi tạo
        this.loadFromCache();
        this.loadDevMode();
        
        // Nếu không có cache, khởi tạo 4 thành viên mặc định
        if (this.members.length === 0) {
            for (let i = 0; i < 4; i++) {
                this.addMember();
            }
        }

        // Bind event listeners
        this.bindEvents();
        
        // Setup dev mode detector
        this.setupDevModeDetector();
        
        // Handle URL routing
        this.handleUrlRouting();
    }

    bindEvents() {
        // Nút thêm thành viên
        document.getElementById('addMemberBtn').addEventListener('click', () => {
            this.addMember();
        });

        // Nút tính lương
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculateSalary();
        });

        // Nút copy kết quả
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.copyResultsToClipboard();
        });

        // Nút xem lịch sử
        document.getElementById('historyBtn').addEventListener('click', () => {
            this.showHistory();
        });

        // Nút đóng lịch sử
        document.getElementById('closeHistoryBtn').addEventListener('click', () => {
            this.hideHistory();
        });

        // Nút đóng chi tiết lịch sử
        document.getElementById('closeHistoryDetailBtn').addEventListener('click', () => {
            this.hideHistoryDetail();
        });

        // Theo dõi thay đổi input để reset kết quả
        document.getElementById('totalRevenue').addEventListener('input', () => {
            this.resetResults();
        });
    }

    addMember() {
        const memberIndex = this.members.length;
        const member = {
            id: Date.now() + memberIndex,
            name: '',
            percentage: 0,
            expenses: 0
        };

        this.members.push(member);
        this.renderMember(member, memberIndex);
    }

    renderMember(member, index) {
        const membersContainer = document.getElementById('membersContainer');
        
        const memberCard = document.createElement('div');
        memberCard.className = 'neo-member-card';
        memberCard.dataset.memberId = member.id;

        memberCard.innerHTML = `
            <div class="neo-member-header">
                <div class="neo-member-number">THÀNH VIÊN ${index + 1}</div>
                ${this.members.length > 1 ? '<button type="button" class="neo-remove-btn" onclick="salaryCalculator.removeMember(' + member.id + ')">XÓA</button>' : ''}
            </div>
            <div class="neo-member-inputs">
                <div class="neo-input-group neo-name-input-group">
                    <label>TÊN THÀNH VIÊN</label>
                    <div class="neo-name-input-with-avatar">
                        <div class="neo-member-avatar-container" id="avatarContainer-${member.id}" style="display: none;">
                            <img src="" alt="" class="neo-member-avatar-form" id="avatar-${member.id}">
                        </div>
                        <input type="text" placeholder="NHẬP TÊN THÀNH VIÊN" data-field="name" data-member-id="${member.id}">
                    </div>
                </div>
                <div class="neo-input-group">
                    <label>% NHẬN ĐƯỢC</label>
                    <input type="number" placeholder="%" min="0" max="100" data-field="percentage" data-member-id="${member.id}">
                </div>
                <div class="neo-input-group">
                    <label>SỐ TIỀN ĐÃ CHI (VNĐ)</label>
                    <input type="text" placeholder="100000 hoặc 50000 + 30000 + 20000" min="0" data-field="expenses" data-member-id="${member.id}">
                </div>
            </div>
        `;

        membersContainer.appendChild(memberCard);

        // Bind input events cho thành viên mới
        this.bindMemberInputs(memberCard);
    }

    bindMemberInputs(memberCard) {
        const inputs = memberCard.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const memberId = parseInt(e.target.dataset.memberId);
                const field = e.target.dataset.field;
                
                let value;
                if (field === 'name') {
                    value = e.target.value;
                } else if (field === 'expenses') {
                    // Lưu giá trị text để có thể tính toán sau
                    value = e.target.value.trim();
                } else {
                    value = parseFloat(e.target.value) || 0;
                }
                
                const member = this.members.find(m => m.id === memberId);
                if (member) {
                    member[field] = value;
                }

                // Cập nhật avatar khi nhập tên
                if (field === 'name') {
                    this.updateMemberAvatar(memberId, value);
                }

                this.resetResults();
            });
        });
    }

    updateMemberAvatar(memberId, name) {
        const avatar = this.getAvatarForMember(name);
        const avatarContainer = document.getElementById(`avatarContainer-${memberId}`);
        const avatarImg = document.getElementById(`avatar-${memberId}`);
        
        if (avatar && avatarContainer && avatarImg) {
            avatarImg.src = `assets/${avatar}`;
            avatarImg.alt = name;
            avatarContainer.style.display = 'flex';
        } else if (avatarContainer) {
            avatarContainer.style.display = 'none';
        }
    }

    removeMember(memberId) {
        if (this.members.length <= 1) {
            alert('Phải có ít nhất 1 thành viên!');
            return;
        }

        // Xóa từ array
        this.members = this.members.filter(m => m.id !== memberId);
        
        // Xóa từ DOM
        const memberCard = document.querySelector(`[data-member-id="${memberId}"]`);
        if (memberCard) {
            memberCard.closest('.neo-member-card').remove();
        }

        // Cập nhật số thứ tự
        this.updateMemberNumbers();
        this.resetResults();
    }

    updateMemberNumbers() {
        const memberCards = document.querySelectorAll('.neo-member-card');
        memberCards.forEach((card, index) => {
            const memberNumber = card.querySelector('.neo-member-number');
            memberNumber.textContent = `THÀNH VIÊN ${index + 1}`;
        });
    }

    calculateSalary() {
        // Validate và tính toán doanh thu
        const totalRevenueInput = document.getElementById('totalRevenue').value.trim();
        const totalRevenue = this.evaluateExpression(totalRevenueInput);
        
        if (totalRevenue <= 0) {
            alert('Vui lòng nhập tổng doanh thu hợp lệ!\nBạn có thể nhập số hoặc phép tính như: 1000000 + 500000');
            return;
        }

        // Validate members
        let totalPercentage = 0;
        const validMembers = [];

        for (const member of this.members) {
            if (member.name.trim() === '') {
                alert('Vui lòng nhập tên cho tất cả thành viên!');
                return;
            }
            
            if (member.percentage <= 0) {
                alert('Vui lòng nhập phần trăm nhận được cho tất cả thành viên!');
                return;
            }

            // Tính toán chi phí với biểu thức
            const expenseInput = document.querySelector(`[data-member-id="${member.id}"][data-field="expenses"]`).value.trim();
            const calculatedExpenses = this.evaluateExpression(expenseInput);
            
            // Cập nhật chi phí đã tính toán vào member object
            member.expenses = calculatedExpenses;

            totalPercentage += member.percentage;
            validMembers.push(member);
        }

        if (totalPercentage !== 100) {
            alert(`Tổng phần trăm phải bằng 100%! Hiện tại: ${totalPercentage}%`);
            return;
        }

        // Tính toán
        const totalExpenses = validMembers.reduce((sum, member) => sum + member.expenses, 0);
        const netProfit = totalRevenue - totalExpenses;
        const expensePerPerson = totalExpenses / validMembers.length;

        this.results = {
            totalRevenue,
            totalExpenses,
            netProfit,
            expensePerPerson,
            members: validMembers.map(member => {
                // Tính lương theo % doanh thu (chưa trừ chi phí)
                const salaryFromRevenue = (totalRevenue * member.percentage) / 100;
                // Lương cuối cùng = Lương từ lợi nhuận + Chi phí đã chi
                const salaryFromProfit = (netProfit * member.percentage) / 100;
                const memberSalary = salaryFromProfit + member.expenses;
                return {
                    ...member,
                    salary: memberSalary,
                    salaryFromRevenue: salaryFromRevenue,
                    salaryFromProfit: salaryFromProfit,
                    expensePerPerson: expensePerPerson
                };
            }),
            calculatedAt: new Date().toISOString()
        };

        // Lưu vào cache sau khi tính toán thành công
        this.saveToCache();

        this.displayResults();
    }

    displayResults() {
        const resultsSection = document.getElementById('resultsSection');
        const resultsContainer = document.getElementById('resultsContainer');
        
        // Clear previous results
        resultsContainer.innerHTML = '';

        // Display member results
        this.results.members.forEach(member => {
            const avatar = this.getAvatarForMember(member.name);
            const resultItem = document.createElement('div');
            resultItem.className = 'neo-result-item';
            resultItem.innerHTML = `
                <div class="neo-result-header">
                    <div class="neo-result-name-with-avatar">
                        ${avatar ? `<img src="assets/${avatar}" alt="${member.name}" class="neo-member-avatar">` : ''}
                        <span class="neo-result-name">${member.name.toUpperCase()}</span>
                    </div>
                    <div class="neo-result-salary">${this.formatCurrency(member.salary)}</div>
                </div>
                <div class="neo-result-details">
                    <div>LƯƠNG THEO % DOANH THU: ${this.formatCurrency(member.salaryFromRevenue)}</div>
                    <div>PHẦN TRĂM: ${member.percentage}%</div>
                    <div>ĐÃ CHI: ${this.formatCurrency(member.expenses)}</div>
                </div>
            `;
            resultsContainer.appendChild(resultItem);
        });

        // Update summary
        document.getElementById('summaryRevenue').textContent = this.formatCurrency(this.results.totalRevenue);
        document.getElementById('summaryExpenses').textContent = this.formatCurrency(this.results.totalExpenses);
        document.getElementById('summaryNetProfit').textContent = this.formatCurrency(this.results.netProfit);
        


        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    resetResults() {
        this.results = null;
        document.getElementById('resultsSection').style.display = 'none';
    }

    async copyResultsToClipboard() {
        if (!this.results) {
            alert('Vui lòng tính toán trước khi copy kết quả!');
            return;
        }

        // Tạo dữ liệu xuất với format để paste vào file JS
        const exportData = {
            ...this.results,
            exportedAt: new Date().toISOString()
        };

        // Format dữ liệu để paste vào mảng JavaScript với dấu phẩy
        const dataStr = JSON.stringify(exportData, null, 4) + ',';
        
        try {
            await navigator.clipboard.writeText(dataStr);
            alert('✅ Đã copy kết quả vào clipboard!');
        } catch (error) {
            // Fallback cho trình duyệt không hỗ trợ clipboard API
            console.error('Clipboard API không khả dụng:', error);
            
            // Tạo textarea tạm để copy
            const textarea = document.createElement('textarea');
            textarea.value = dataStr;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            alert('✅ Đã copy kết quả vào clipboard!');
        }
    }

    showHistory() {
        const historySection = document.getElementById('historySection');
        const historyContainer = document.getElementById('historyContainer');
        
        // Lấy dữ liệu lịch sử từ file
        const historyData = window.salaryHistoryData || [];
        
        if (historyData.length === 0) {
            historyContainer.innerHTML = `
                <div class="neo-no-history">
                    <div class="neo-no-history-icon">📊</div>
                    <h4>CHƯA CÓ LỊCH SỬ</h4>
                    <p>HÃY TÍNH LƯƠNG VÀ COPY KẾT QUẢ VÀO FILE SALARY-HISTORY-DATA.JS ĐỂ XEM LỊCH SỬ</p>
                </div>
            `;
        } else {
            // Sắp xếp theo thời gian mới nhất
            const sortedHistory = [...historyData].sort((a, b) => 
                new Date(b.calculatedAt) - new Date(a.calculatedAt)
            );
            
            historyContainer.innerHTML = sortedHistory.map((item, index) => this.renderHistoryItem(item, index)).join('');
        }
        
        // Hiển thị drawer với animation
        historySection.classList.add('show');
        
        // Khóa scroll của body
        document.body.style.overflow = 'hidden';
    }

    hideHistory() {
        const historySection = document.getElementById('historySection');
        historySection.classList.remove('show');
        
        // Mở khóa scroll của body
        document.body.style.overflow = 'auto';
    }

    renderHistoryItem(item, index) {
        const exportDate = new Date(item.exportedAt || item.calculatedAt);
        
        // Tính tháng trước đó (nếu xuất tháng 5 thì hiển thị tháng 4)
        const previousMonth = new Date(exportDate);
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        
        const month = previousMonth.getMonth() + 1;
        const year = previousMonth.getFullYear();
        const monthStr = month.toString().padStart(2, '0');
        
        const exportDateFormatted = exportDate.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="neo-history-item" onclick="salaryCalculator.showHistoryDetail(${index})">
                <div class="neo-history-item-header">
                    <div class="neo-history-month">THÁNG ${monthStr}/${year}</div>
                    <div class="neo-history-export-date">XUẤT NGÀY: ${exportDateFormatted}</div>
                </div>
            </div>
        `;
    }

    showHistoryDetail(index) {
        const historyData = window.salaryHistoryData || [];
        const sortedHistory = [...historyData].sort((a, b) => 
            new Date(b.calculatedAt) - new Date(a.calculatedAt)
        );
        const item = sortedHistory[index];
        
        if (!item) return;

        const exportDate = new Date(item.exportedAt || item.calculatedAt);
        const previousMonth = new Date(exportDate);
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        
        const month = previousMonth.getMonth() + 1;
        const year = previousMonth.getFullYear();
        const monthStr = month.toString().padStart(2, '0');
        
        // Cập nhật URL
        window.history.pushState({ month, year, index }, '', `#month=${monthStr}&year=${year}`);

        // Cập nhật tiêu đề
        document.getElementById('historyDetailTitle').textContent = `KẾT QUẢ TÍNH LƯƠNG - THÁNG ${monthStr}/${year}`;

        // Render chi tiết với UI giống kết quả tính lương
        this.renderHistoryDetailAsResults(item);

        // Hiển thị modal
        const modal = document.getElementById('historyDetailModal');
        modal.classList.add('show');
        
        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideHistoryDetail();
            }
        };
    }

    renderHistoryDetailAsResults(item) {
        const detailContainer = document.getElementById('historyDetailContainer');
        
        // Tính toán lại các giá trị cần thiết cho dữ liệu cũ
        const members = item.members.map(member => ({
            ...member,
            salaryFromRevenue: member.salaryFromRevenue || (item.totalRevenue * member.percentage) / 100
        }));

        detailContainer.innerHTML = `
            <div class="neo-results-content">
                <div class="neo-results-members">
                    ${members.map(member => {
                        const avatar = this.getAvatarForMember(member.name);
                        return `
                        <div class="neo-result-item">
                            <div class="neo-result-header">
                                <div class="neo-result-name-with-avatar">
                                    ${avatar ? `<img src="assets/${avatar}" alt="${member.name}" class="neo-member-avatar">` : ''}
                                    <span class="neo-result-name">${member.name.toUpperCase()}</span>
                                </div>
                                <div class="neo-result-salary">${this.formatCurrency(member.salary)}</div>
                            </div>
                            <div class="neo-result-details">
                                <div>LƯƠNG THEO % DOANH THU: ${this.formatCurrency(member.salaryFromRevenue)}</div>
                                <div>PHẦN TRĂM: ${member.percentage}%</div>
                                <div>ĐÃ CHI: ${this.formatCurrency(member.expenses)}</div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="neo-summary">
                    <div class="neo-summary-item">
                        <span class="neo-summary-label">TỔNG DOANH THU:</span>
                        <span class="neo-summary-value">${this.formatCurrency(item.totalRevenue)}</span>
                    </div>
                    <div class="neo-summary-item">
                        <span class="neo-summary-label">TỔNG CHI PHÍ:</span>
                        <span class="neo-summary-value">${this.formatCurrency(item.totalExpenses)}</span>
                    </div>
                    <div class="neo-summary-item neo-summary-profit">
                        <span class="neo-summary-label">TỔNG DOANH THU:</span>
                        <span class="neo-summary-value">${this.formatCurrency(item.netProfit)}</span>
                    </div>
                </div>
                
                <div class="neo-share-section">
                    <button type="button" onclick="salaryCalculator.shareResult(${this.escapeJsonForHtml(JSON.stringify(item))})" class="neo-btn neo-btn-share">
                        <span class="neo-btn-text">🔗 CHIA SẺ KẾT QUẢ</span>
                        <div class="neo-btn-shadow"></div>
                    </button>
                    <p class="neo-share-hint">TẠO LINK ĐỂ CHIA SẺ KẾT QUẢ VỚI NHÓM</p>
                </div>
            </div>
        `;
    }

    hideHistoryDetail() {
        document.getElementById('historyDetailModal').classList.remove('show');
        // Xóa URL hash
        window.history.pushState('', '', window.location.pathname);
    }

    handleUrlRouting() {
        // Xử lý URL khi load trang
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const month = params.get('month');
            const year = params.get('year');
            const isShared = params.get('shared');
            
            // Nếu không phải shared link, xử lý như history detail
            if (month && year && isShared !== 'true') {
                this.openHistoryByMonthYear(month, year);
            }
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.month && e.state.year) {
                this.openHistoryByMonthYear(e.state.month.toString().padStart(2, '0'), e.state.year);
            } else {
                this.hideHistoryDetail();
            }
        });
    }

    openHistoryByMonthYear(month, year) {
        const historyData = window.salaryHistoryData || [];
        const sortedHistory = [...historyData].sort((a, b) => 
            new Date(b.calculatedAt) - new Date(a.calculatedAt)
        );

        // Tìm item phù hợp với tháng/năm
        const index = sortedHistory.findIndex(item => {
            const exportDate = new Date(item.exportedAt || item.calculatedAt);
            const previousMonth = new Date(exportDate);
            previousMonth.setMonth(previousMonth.getMonth() - 1);
            
            const itemMonth = previousMonth.getMonth() + 1;
            const itemYear = previousMonth.getFullYear();
            
            return itemMonth.toString().padStart(2, '0') === month && 
                   itemYear.toString() === year;
        });

        if (index !== -1) {
            const item = sortedHistory[index];
            document.getElementById('historyDetailTitle').textContent = `KẾT QUẢ TÍNH LƯƠNG - THÁNG ${month}/${year}`;
            this.renderHistoryDetailAsResults(item);
            
            const modal = document.getElementById('historyDetailModal');
            modal.classList.add('show');
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.hideHistoryDetail();
                }
            };
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Get avatar for member name
    getAvatarForMember(name) {
        const lowerName = name.toLowerCase().trim();
        
        // Kiểm tra xem tên có chứa các từ khóa hay không
        if (lowerName.includes('liên')) {
            return 'avt_lien.jpg';
        }
        if (lowerName.includes('nhân')) {
            return 'avt_nhan.jpg';
        }
        if (lowerName.includes('nguyên')) {
            return 'avt_nguyen.jpg';
        }
        if (lowerName.includes('ngân')) {
            return 'avt_ngan.png';
        }
        
        return null;
    }

    // Tính toán biểu thức toán học an toàn
    evaluateExpression(expression) {
        try {
            if (!expression || typeof expression !== 'string') {
                return 0;
            }

            // Loại bỏ khoảng trắng và định dạng số
            let cleanExpression = expression.replace(/\s/g, '').replace(/,/g, '');
            
            // Kiểm tra chỉ chứa số và các phép toán cơ bản
            const validPattern = /^[0-9+\-*/().]+$/;
            if (!validPattern.test(cleanExpression)) {
                // Nếu không phải biểu thức toán học, thử parse như số
                const num = parseFloat(expression.replace(/,/g, ''));
                return isNaN(num) ? 0 : num;
            }

            // Tính toán biểu thức
            const result = Function('"use strict"; return (' + cleanExpression + ')')();
            return isNaN(result) ? 0 : result;
        } catch (error) {
            console.warn('Lỗi khi tính toán biểu thức:', expression, error);
            // Nếu có lỗi, thử parse như số thông thường
            const num = parseFloat(expression.replace(/,/g, ''));
            return isNaN(num) ? 0 : num;
        }
    }

    // Cache functions
    saveToCache() {
        try {
            const cacheData = {
                totalRevenue: document.getElementById('totalRevenue').value.trim(),
                members: this.members.map(member => ({
                    id: member.id,
                    name: member.name,
                    percentage: member.percentage
                    // Không lưu expenses theo yêu cầu
                })),
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
            console.log('✅ Đã lưu dữ liệu vào cache');
        } catch (error) {
            console.error('❌ Lỗi khi lưu cache:', error);
        }
    }

    loadFromCache() {
        try {
            const cachedData = localStorage.getItem(this.cacheKey);
            if (!cachedData) return;

            const data = JSON.parse(cachedData);
            
            // Load tổng doanh thu
            if (data.totalRevenue) {
                document.getElementById('totalRevenue').value = data.totalRevenue;
            }

            // Load thành viên từ cache
            if (data.members && data.members.length > 0) {
                this.members = data.members.map(member => ({
                    ...member,
                    expenses: 0 // Reset expenses về 0
                }));

                // Render các thành viên
                this.renderAllMembers();
            }

            console.log('✅ Đã tải dữ liệu từ cache:', data.savedAt);
        } catch (error) {
            console.error('❌ Lỗi khi tải cache:', error);
            // Nếu có lỗi, xóa cache bị lỗi
            localStorage.removeItem(this.cacheKey);
        }
    }

    renderAllMembers() {
        const membersContainer = document.getElementById('membersContainer');
        membersContainer.innerHTML = '';

        this.members.forEach((member, index) => {
            this.renderMember(member, index);
            
            // Điền dữ liệu từ cache vào form
            setTimeout(() => {
                const nameInput = document.querySelector(`[data-member-id="${member.id}"][data-field="name"]`);
                const percentageInput = document.querySelector(`[data-member-id="${member.id}"][data-field="percentage"]`);
                
                if (nameInput) nameInput.value = member.name || '';
                if (percentageInput) percentageInput.value = member.percentage || '';
                
                // Cập nhật avatar cho member có tên từ cache
                if (member.name) {
                    this.updateMemberAvatar(member.id, member.name);
                }
            }, 50);
        });
    }

    clearCache() {
        try {
            localStorage.removeItem(this.cacheKey);
            console.log('✅ Đã xóa cache');
        } catch (error) {
            console.error('❌ Lỗi khi xóa cache:', error);
        }
    }

    // Dev Mode functions
    loadDevMode() {
        try {
            const devMode = localStorage.getItem(this.devModeKey);
            this.isDevMode = devMode === 'true';
            if (this.isDevMode) {
                this.enableDevMode();
                console.log('🛠️ Dev mode đã được kích hoạt');
            }
        } catch (error) {
            console.error('❌ Lỗi khi load dev mode:', error);
        }
    }

    saveDevMode() {
        try {
            localStorage.setItem(this.devModeKey, this.isDevMode.toString());
        } catch (error) {
            console.error('❌ Lỗi khi lưu dev mode:', error);
        }
    }

    enableDevMode() {
        this.isDevMode = true;
        this.saveDevMode();
        
        // Hiển thị nút copy
        const exportSection = document.querySelector('.export-section');
        if (exportSection) {
            exportSection.classList.add('dev-mode');
        }
        
        console.log('🛠️ Chế độ Dev đã được kích hoạt! Nút Copy Kết Quả hiện đã khả dụng.');
    }

    setupDevModeDetector() {
        let clickCount = 0;
        let timeout = null;

        document.addEventListener('click', (e) => {
            // Chỉ đếm click vào vùng trống (không phải button, input, etc.)
            if (e.target === document.body || e.target === document.documentElement || 
                e.target.classList.contains('container') || e.target.classList.contains('form-section')) {
                
                clickCount++;
                
                // Reset timeout
                if (timeout) {
                    clearTimeout(timeout);
                }
                
                // Kiểm tra nếu đủ 5 click
                if (clickCount >= 5 && !this.isDevMode) {
                    this.enableDevMode();
                    alert('🛠️ Chế độ Dev đã được kích hoạt!\nNút "📋 Copy Kết Quả" hiện đã khả dụng.');
                    clickCount = 0;
                    return;
                }
                
                // Reset counter sau 2 giây
                timeout = setTimeout(() => {
                    clickCount = 0;
                }, 2000);
            }
        });
    }

    // Share functions
    escapeJsonForHtml(jsonString) {
        return jsonString.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    shareResult(resultData) {
        try {
            // Tính toán tháng/năm từ exportedAt
            const exportDate = new Date(resultData.exportedAt || resultData.calculatedAt);
            const previousMonth = new Date(exportDate);
            previousMonth.setMonth(previousMonth.getMonth() - 1);
            
            const month = previousMonth.getMonth() + 1;
            const year = previousMonth.getFullYear();
            const monthStr = month.toString().padStart(2, '0');

            // Tạo link ngắn với hash URL
            const shareUrl = `${window.location.origin}${window.location.pathname}#month=${monthStr}&year=${year}&shared=true`;
            
            // Copy URL vào clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('🔗 Link chia sẻ đã được copy vào clipboard!\n\nGửi link này cho nhóm để họ xem kết quả tính lương.');
            }).catch(() => {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = shareUrl;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('🔗 Link chia sẻ đã được copy vào clipboard!\n\nGửi link này cho nhóm để họ xem kết quả tính lương.');
            });
        } catch (error) {
            console.error('Lỗi khi tạo link chia sẻ:', error);
            alert('❌ Có lỗi xảy ra khi tạo link chia sẻ. Vui lòng thử lại.');
        }
    }

    checkForSharedData() {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const month = params.get('month');
            const year = params.get('year');
            const isShared = params.get('shared');
            
            if (month && year && isShared === 'true') {
                try {
                    const resultData = this.findResultDataByMonthYear(month, year);
                    if (resultData) {
                        this.displaySharedResult(resultData);
                        return true;
                    } else {
                        alert('❌ Không tìm thấy dữ liệu cho tháng ' + month + '/' + year + '.\nVui lòng kiểm tra file salary-history-data.js.');
                    }
                } catch (error) {
                    console.error('Lỗi khi load dữ liệu chia sẻ:', error);
                    alert('❌ Có lỗi xảy ra khi tải dữ liệu chia sẻ.');
                }
            }
        }
        return false;
    }

    findResultDataByMonthYear(month, year) {
        const historyData = window.salaryHistoryData || [];
        const sortedHistory = [...historyData].sort((a, b) => 
            new Date(b.calculatedAt) - new Date(a.calculatedAt)
        );

        // Tìm item phù hợp với tháng/năm
        const resultData = sortedHistory.find(item => {
            const exportDate = new Date(item.exportedAt || item.calculatedAt);
            const previousMonth = new Date(exportDate);
            previousMonth.setMonth(previousMonth.getMonth() - 1);
            
            const itemMonth = previousMonth.getMonth() + 1;
            const itemYear = previousMonth.getFullYear();
            
            return itemMonth.toString().padStart(2, '0') === month && 
                   itemYear.toString() === year;
        });

        return resultData;
    }

    displaySharedResult(resultData) {
        // Ẩn form và hiển thị kết quả chia sẻ
        document.querySelector('.neo-form-section').style.display = 'none';
        
        // Tính toán tháng/năm để hiển thị
        const exportDate = new Date(resultData.exportedAt || resultData.calculatedAt);
        const previousMonth = new Date(exportDate);
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        
        const month = previousMonth.getMonth() + 1;
        const year = previousMonth.getFullYear();
        const monthStr = month.toString().padStart(2, '0');
        
        // Cập nhật header với format ngày đẹp hơn
        const calculatedDate = new Date(resultData.calculatedAt);
        const calculatedFormatted = calculatedDate.toLocaleDateString('vi-VN') + ' lúc ' + 
                                  calculatedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        let exportedFormatted = '';
        if (resultData.exportedAt) {
            const exportedDate = new Date(resultData.exportedAt);
            exportedFormatted = exportedDate.toLocaleDateString('vi-VN') + ' lúc ' + 
                              exportedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        
        const header = document.querySelector('.neo-header');
        header.innerHTML = `
            <div class="neo-header-content">
                <h1 class="neo-title">📊 KẾT QUẢ TÍNH LƯƠNG</h1>
                <div class="neo-subtitle-block">
                    <p class="neo-subtitle">THÁNG ${monthStr}/${year} - ĐƯỢC CHIA SẺ TỪ NHÓM NOVA VISION</p>
                </div>
                <div class="neo-shared-date">
                    TÍNH TOÁN: ${calculatedFormatted.toUpperCase()}
                    ${resultData.exportedAt ? `<br>XUẤT: ${exportedFormatted.toUpperCase()}` : ''}
                </div>
            </div>
            <div class="neo-header-decoration"></div>
        `;

        // Hiển thị kết quả
        const resultsSection = document.getElementById('resultsSection');
        const resultsContainer = document.getElementById('resultsContainer');
        
        resultsContainer.innerHTML = '';

        // Display member results
        resultData.members.forEach(member => {
            const avatar = this.getAvatarForMember(member.name);
            const resultItem = document.createElement('div');
            resultItem.className = 'neo-result-item';
            resultItem.innerHTML = `
                <div class="neo-result-header">
                    <div class="neo-result-name-with-avatar">
                        ${avatar ? `<img src="assets/${avatar}" alt="${member.name}" class="neo-member-avatar">` : ''}
                        <span class="neo-result-name">${member.name.toUpperCase()}</span>
                    </div>
                    <div class="neo-result-salary">${this.formatCurrency(member.salary)}</div>
                </div>
                <div class="neo-result-details">
                    <div>LƯƠNG THEO % DOANH THU: ${this.formatCurrency(member.salaryFromRevenue)}</div>
                    <div>PHẦN TRĂM: ${member.percentage}%</div>
                    <div>ĐÃ CHI: ${this.formatCurrency(member.expenses)}</div>
                </div>
            `;
            resultsContainer.appendChild(resultItem);
        });

        // Update summary
        document.getElementById('summaryRevenue').textContent = this.formatCurrency(resultData.totalRevenue);
        document.getElementById('summaryExpenses').textContent = this.formatCurrency(resultData.totalExpenses);
        document.getElementById('summaryNetProfit').textContent = this.formatCurrency(resultData.netProfit);

        // Ẩn nút export và thêm nút quay lại
        const exportSection = document.querySelector('.neo-export-section');
        exportSection.innerHTML = `
            <button type="button" onclick="window.location.href = window.location.pathname" class="neo-btn neo-btn-back">
                <span class="neo-btn-text">← QUAY LẠI TRANG TÍNH LƯƠNG</span>
                <div class="neo-btn-shadow"></div>
            </button>
        `;
        exportSection.style.display = 'block';

        // Show results section
        resultsSection.style.display = 'block';
    }
}

// Khởi tạo ứng dụng khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    window.salaryCalculator = new SalaryCalculator();
});

// Utility functions cho validation
function validateInput(input, type = 'number') {
    const value = input.value.trim();
    
    if (type === 'number') {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
            input.setCustomValidity('Vui lòng nhập số hợp lệ (>= 0)');
            return false;
        }
        input.setCustomValidity('');
        return true;
    }
    
    if (type === 'text') {
        if (value === '') {
            input.setCustomValidity('Vui lòng nhập thông tin này');
            return false;
        }
        input.setCustomValidity('');
        return true;
    }
    
    return true;
}

// Format số tiền trong input
function formatInputCurrency(input) {
    const value = input.value.replace(/[^\d]/g, '');
    if (value) {
        const formatted = new Intl.NumberFormat('vi-VN').format(value);
        input.value = formatted;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter = Calculate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('calculateBtn').click();
    }
    
    // Ctrl/Cmd + S = Copy results
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection.style.display !== 'none') {
            document.getElementById('exportBtn').click();
        }
    }
    
    // ESC = Close modals
    if (e.key === 'Escape') {
        const historyDetailModal = document.getElementById('historyDetailModal');
        const historySection = document.getElementById('historySection');
        
        if (historyDetailModal.classList.contains('show')) {
            e.preventDefault();
            window.salaryCalculator.hideHistoryDetail();
        } else if (historySection.classList.contains('show')) {
            e.preventDefault();
            window.salaryCalculator.hideHistory();
        }
    }
}); 