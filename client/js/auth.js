// 1. 確保網址是 https 且結尾沒有多餘斜線
const API_BASE_URL = 'https://shiqingbackend.loca.lt';

console.log('AUTH JS (Login) 已載入 - 支援 Admin 跳轉');

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        console.error('找不到 id 為 login-form 的表單，請檢查 HTML');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('--- 開始執行登入程序 ---');

        const formData = new FormData(loginForm);
        const payload = {
            email: formData.get('email')?.trim(),
            password: formData.get('password')
        };

        if (!payload.email || !payload.password) {
            alert('請填寫信箱與密碼');
            return;
        }

        console.log('發送請求至:', `${API_BASE_URL}/api/auth/login`);

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `連線失敗 (狀態碼: ${res.status})`);
            }

            const result = await res.json();
            console.log('後端回傳結果:', result);

            if (result.success) {
                const token = result.data?.token;
                const user = result.data?.user; // 包含 name, email, role

                if (!token) throw new Error('伺服器未回傳驗證碼 (Token)');

                // --- 核心修改：儲存角色資訊 ---
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('userRole', user.role); // 單獨存一份方便 admin.js 檢查

                alert(`登入成功！歡迎回來，${user.name}`);

                // --- 核心修改：根據角色自動跳轉 ---
                if (user.role === 'admin') {
                    console.log('偵測為管理員，跳轉至後台...');
                    window.location.href = './admin.html';
                } else {
                    console.log('偵測為一般用戶，跳轉至個人中心...');
                    window.location.href = './account.html';
                }

            } else {
                throw new Error(result.message || '登入失敗');
            }

        } catch (error) {
            console.error('Login Error:', error);
            
            if (error.message.includes('Failed to fetch')) {
                alert('無法連線到後端伺服器。請檢查：\n1. B電腦的 Localtunnel 是否已開啟\n2. 您是否已手動點擊過 Localtunnel 的 Continue 按鈕');
            } else {
                alert(error.message);
            }
        }
    });
});
