const API_BASE_URL = 'https://thin-dragonfly-76.loca.lt'; 

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const nameInput = document.querySelector('input[name="name"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmInput = document.querySelector('input[name="confirmPassword"]');
    const errorMsg = document.getElementById('password-error');
    const submitBtn = document.querySelector('button[type="submit"]');

    // --- 建立密碼強度顯示區 (若 HTML 已有則不重複建立) ---
    let strengthWrapper = document.getElementById('password-strength-wrapper');
    if (!strengthWrapper) {
        strengthWrapper = document.createElement('div');
        strengthWrapper.id = 'password-strength-wrapper';
        strengthWrapper.style = 'margin-top: 10px; display: none;';
        strengthWrapper.innerHTML = `
            <div id="strength-bar" style="height: 6px; width: 0%; transition: 0.4s; border-radius: 3px; background: #eee;"></div>
            <p id="strength-text" style="font-size: 13px; margin-top: 5px; font-weight: 500;"></p>
        `;
        passwordInput.parentNode.appendChild(strengthWrapper);
    }
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

    // --- 核心驗證邏輯 ---
    function validateAll() {
        const nameVal = nameInput.value.trim();
        const p1 = passwordInput.value;
        const p2 = confirmInput.value;

        // 1. 姓名驗證：僅限中文 (\u4e00-\u9fa5) 或 英文 (A-Za-z)
        const nameRegex = /^[A-Za-z\u4e00-\u9fa5\s]+$/;
        const isNameValid = nameRegex.test(nameVal);
        nameInput.style.borderColor = (nameVal.length > 0 && !isNameValid) ? '#d9534f' : '';

        // 2. 密碼強度判定
        let score = 0;
        if (p1.length > 0) {
            strengthWrapper.style.display = 'block';
            if (p1.length >= 8) score++;      // 長度達標
            if (/[A-Z]/.test(p1)) score++;    // 有大寫字母
            if (/[0-9]/.test(p1)) score++;    // 有數字
            if (/[^A-Za-z0-9]/.test(p1)) score++; // 有特殊符號

            if (p1.length < 8) {
                updateBar(20, '#d9534f', '❌ 至少需 8 位元');
            } else if (score <= 1) {
                updateBar(40, '#f0ad4e', '⚠️ 強度：弱 (建議混合數字與大寫)');
            } else if (score === 2 || score === 3) {
                updateBar(70, '#5bc0de', 'OK 強度：中');
            } else {
                updateBar(100, '#5cb85c', '✅ 強度：強');
            }
        } else {
            strengthWrapper.style.display = 'none';
        }

        // 3. 密碼一致性檢查
        const isMatch = (p1 === p2 && p2.length > 0);
        if (p2.length > 0) {
            errorMsg.style.display = isMatch ? 'none' : 'block';
            confirmInput.style.borderColor = isMatch ? '' : '#d9534f';
        }

        // 4. 按鈕啟用邏輯：姓名格式正確 + 密碼長度足夠 + 兩次輸入一致
        const canSubmit = isNameValid && p1.length >= 8 && isMatch;
        submitBtn.disabled = !canSubmit;
        submitBtn.style.opacity = canSubmit ? '1' : '0.6';
    }

    function updateBar(width, color, label) {
        strengthBar.style.width = width + '%';
        strengthBar.style.backgroundColor = color;
        strengthText.innerText = label;
        strengthText.style.color = color;
    }

    // 監聽所有輸入欄位
    [nameInput, passwordInput, confirmInput].forEach(input => {
        input.addEventListener('input', validateAll);
    });

    // --- 提交表單 ---
    registerForm?.addEventListener('submit', async e => {
        e.preventDefault();
        
        const payload = {
            name: nameInput.value.trim(),
            email: document.querySelector('input[name="email"]').value.trim(),
            password: passwordInput.value
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            
            if (!res.ok || !result.success) {
                throw new Error(result.message || '註冊失敗');
            }

            alert('註冊成功！將為您跳轉至登入頁面');
            window.location.href = '/login.html';
            
        } catch (error) {
            alert(error.message);
            console.error('Registration error:', error);
        }
    });
});
